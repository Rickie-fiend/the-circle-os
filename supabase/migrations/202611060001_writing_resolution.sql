-- Follow-up only. Do not reapply the original writing migration. Activation is separate.
begin;
create table circle_private.writing_resolutions (
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  entry_id text not null,
  request_hash text not null,
  request_body jsonb,
  result_head jsonb,
  primary key (owner_id, request_id)
);
alter table circle_private.writing_resolutions enable row level security;
revoke all on circle_private.writing_resolutions from public, anon, authenticated, service_role;
grant select on circle_private.writing_resolutions to authenticated;
create policy writing_owner_read on circle_private.writing_resolutions for select to authenticated
  using (owner_id = (select auth.uid()));

create function circle_private.scrub_writing_resolutions() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.snapshot->'tombstone' <> 'null'::jsonb then
    update circle_private.writing_resolutions set request_body=null, result_head=null
      where owner_id=new.owner_id and entry_id=new.entry_id;
  end if;
  return new;
end $$;
create trigger writing_resolution_deletion after insert or update on circle_private.writing_heads
  for each row execute function circle_private.scrub_writing_resolutions();

create function public.circle_writing_resolve(request jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  who uuid := circle_private.writing_account(); h circle_private.writing_heads;
  previous circle_private.writing_resolutions; eid text; rid text; rhash text;
  local_entry jsonb; remote_entry jsonb; chosen jsonb; result_entry jsonb; head jsonb;
  version jsonb; shared jsonb; op jsonb; ids text[] := '{}'; generation bigint := 0;
begin
  if request is null or octet_length(request::text) > 2097152 or
    not coalesce(circle_private.writing_keys(request,array['requestId','entryId','local','cloud','choice','at','versionId','changes']),false) then
    raise exception 'Invalid writing choice';
  end if;
  eid := request->>'entryId'; rid := request->>'requestId';
  if not coalesce(circle_private.writing_id(eid),false) or jsonb_typeof(request->'entryId') <> 'string' or
    jsonb_typeof(request->'requestId') <> 'string' or rid !~ '^[a-f0-9]{64}$' or
    jsonb_typeof(request->'choice') <> 'string' or request->>'choice' not in ('local','cloud') or
    not coalesce(circle_private.writing_id(request->>'versionId'),false) or jsonb_typeof(request->'versionId') <> 'string' or
    not circle_private.writing_time(request->'at') or not circle_private.writing_snapshot(request->'local') or
    not coalesce(circle_private.writing_keys(request->'cloud',array['owner','entryId','serverVersion','snapshot']),false) or
    request->'cloud'->>'owner' is distinct from 'account:' || who::text or
    request->'cloud'->>'entryId' is distinct from eid or
    not circle_private.writing_snapshot(request->'cloud'->'snapshot') or
    jsonb_typeof(request->'cloud'->'serverVersion') <> 'number' or
    (request->'cloud'->>'serverVersion')::numeric not between 1 and 9007199254740991 or
    trunc((request->'cloud'->>'serverVersion')::numeric) <> (request->'cloud'->>'serverVersion')::numeric or
    jsonb_typeof(request->'changes') <> 'array' or jsonb_array_length(request->'changes') > 1000 then
    raise exception 'Invalid writing choice';
  end if;
  local_entry := request->'local'->'entry'; remote_entry := request->'cloud'->'snapshot'->'entry';
  if local_entry = 'null'::jsonb or remote_entry = 'null'::jsonb or local_entry->>'id' is distinct from eid or
    remote_entry->>'id' is distinct from eid or local_entry->'kind' <> remote_entry->'kind' or
    local_entry->'source' <> remote_entry->'source' or local_entry->'startedAt' <> remote_entry->'startedAt' or
    local_entry->'createdAt' <> remote_entry->'createdAt' then raise exception 'Original writing changed'; end if;
  for version in select * from jsonb_array_elements(local_entry->'versions') loop
    select value into shared from jsonb_array_elements(remote_entry->'versions') where value->>'id'=version->>'id';
    if found and shared <> version then raise exception 'Saved writing version changed'; end if;
  end loop;
  if exists(select 1 from jsonb_array_elements((local_entry->'versions') || (remote_entry->'versions')) v
    where v->>'id'=request->>'versionId') then raise exception 'Version ID reused'; end if;
  for op in select * from jsonb_array_elements(request->'changes') loop
    if not coalesce(circle_private.writing_keys(op,array['operationId','fingerprint','generation']),false) or
      jsonb_typeof(op->'operationId') <> 'string' or not coalesce(circle_private.writing_id(op->>'operationId'),false) or
      op->>'operationId'=any(ids) or jsonb_typeof(op->'fingerprint') <> 'string' or op->>'fingerprint' !~ '^[a-f0-9]{64}$' or
      jsonb_typeof(op->'generation') <> 'number' or (op->>'generation')::numeric <> trunc((op->>'generation')::numeric) or
      (op->>'generation')::numeric <= generation or (op->>'generation')::numeric > 9007199254740991 then
      raise exception 'Invalid writing choice operations';
    end if;
    ids := array_append(ids,op->>'operationId'); generation := (op->>'generation')::bigint;
  end loop;
  if cardinality(ids)>0 and generation <> (local_entry->>'generation')::bigint then raise exception 'Invalid writing choice generation'; end if;
  rhash := encode(sha256(convert_to((request - 'requestId')::text,'UTF8')),'hex');
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(who::text,0));
  select * into h from circle_private.writing_heads where owner_id=who and entry_id=eid for update;
  if not found then raise exception 'Writing is unavailable'; end if;
  if h.snapshot->'tombstone' <> 'null'::jsonb then
    return jsonb_build_object('status','deleted','requestId',rid,'head',circle_private.writing_head_json(h));
  end if;
  select * into previous from circle_private.writing_resolutions where owner_id=who and request_id=rid;
  if found then
    if previous.request_hash <> rhash then raise exception 'Writing choice ID reused'; end if;
    return jsonb_build_object('status','resolved','requestId',rid,'head',previous.result_head);
  end if;
  if h.server_version <> (request->'cloud'->>'serverVersion')::bigint or h.snapshot <> request->'cloud'->'snapshot' then
    return jsonb_build_object('status','changed','requestId',rid,'head',circle_private.writing_head_json(h));
  end if;
  chosen := case when request->>'choice'='local' then local_entry else remote_entry end;
  version := (chosen->'versions')->(jsonb_array_length(chosen->'versions')-1);
  version := version || jsonb_build_object('id',request->>'versionId','sequence',jsonb_array_length(remote_entry->'versions')+1,'savedAt',request->>'at');
  result_entry := remote_entry || jsonb_build_object('generation',greatest((local_entry->>'generation')::bigint,(remote_entry->>'generation')::bigint)+1,
    'updatedAt',request->>'at','status',chosen->>'status','currentVersionId',request->>'versionId','versions',(remote_entry->'versions') || jsonb_build_array(version));
  if not circle_private.writing_snapshot(jsonb_build_object('entry',result_entry,'tombstone',null)) or h.server_version >= 9007199254740991 then
    raise exception 'Invalid resolved writing';
  end if;
  update circle_private.writing_heads set server_version=h.server_version+1,
    snapshot=jsonb_build_object('entry',result_entry,'tombstone',null)
    where owner_id=who and entry_id=eid returning * into h;
  head := circle_private.writing_head_json(h);
  insert into circle_private.writing_resolutions values(who,rid,eid,rhash,request,head);
  return jsonb_build_object('status','resolved','requestId',rid,'head',head);
end $$;
create function public.circle_writing_resolution_history(after_id text default '', page_size integer default 50) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare who uuid := circle_private.writing_account(); result jsonb;
begin
  if after_id is null or page_size is null or page_size not between 1 and 50 then raise exception 'Invalid writing history page'; end if;
  select coalesce(jsonb_agg(jsonb_build_object('request',r.request_body,'head',r.result_head) order by r.request_id),'[]'::jsonb) into result
    from (select * from circle_private.writing_resolutions where owner_id=who and request_id>after_id
      and request_body is not null and result_head is not null order by request_id limit page_size) r;
  return result;
end $$;
revoke all on function circle_private.scrub_writing_resolutions(), public.circle_writing_resolve(jsonb), public.circle_writing_resolution_history(text,integer)
  from public, anon, authenticated, service_role;
grant execute on function public.circle_writing_resolve(jsonb), public.circle_writing_resolution_history(text,integer) to authenticated;
commit;
