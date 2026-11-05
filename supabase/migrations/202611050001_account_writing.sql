-- Private account writing. Apply only after reviewing the local access-test results.
begin;
create schema if not exists circle_private;
revoke all on schema circle_private from public, anon, authenticated, service_role;
grant usage on schema circle_private to authenticated;

create table circle_private.writing_heads (
  owner_id uuid not null references auth.users(id) on delete cascade,
  entry_id text not null,
  server_version bigint not null check (server_version between 1 and 9007199254740991),
  snapshot jsonb not null,
  primary key (owner_id, entry_id)
);
create table circle_private.writing_receipts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation_id text not null,
  entry_id text not null,
  fingerprint text not null,
  generation bigint not null,
  receipt_id uuid not null default gen_random_uuid(),
  server_version bigint not null,
  request_id text not null,
  request_hash text not null,
  primary key (owner_id, operation_id),
  unique (owner_id, receipt_id)
);
create table circle_private.writing_conflicts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  request_id text not null,
  request_hash text not null,
  entry_id text not null,
  candidate jsonb, -- Scrubbed on permanent deletion; never a draft.
  primary key (owner_id, request_id)
);
alter table circle_private.writing_heads enable row level security;
alter table circle_private.writing_receipts enable row level security;
alter table circle_private.writing_conflicts enable row level security;
revoke all on all tables in schema circle_private from public, anon, authenticated, service_role;
grant select on circle_private.writing_heads, circle_private.writing_receipts,
  circle_private.writing_conflicts to authenticated;
create policy writing_owner_read on circle_private.writing_heads for select to authenticated
  using (owner_id = (select auth.uid()));
create policy writing_owner_read on circle_private.writing_receipts for select to authenticated
  using (owner_id = (select auth.uid()));
create policy writing_owner_read on circle_private.writing_conflicts for select to authenticated
  using (owner_id = (select auth.uid()));

-- All writes go through the atomic RPC. Helpers have no public execution grant.
create function circle_private.writing_id(value text) returns boolean
language sql immutable set search_path = '' as $$
  select value ~ '^[A-Za-z0-9_-]{1,128}$' and value not in ('__proto__','prototype','constructor')
$$;
create function circle_private.writing_keys(value jsonb, keys text[]) returns boolean
language sql immutable set search_path = '' as $$
  select jsonb_typeof(value) = 'object' and
    (select array_agg(k order by k) from jsonb_object_keys(value) k) =
    (select array_agg(k order by k) from unnest(keys) k)
$$;
create function circle_private.writing_time(value jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  return coalesce(jsonb_typeof(value) = 'string' and value #>> '{}' ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$'
    and to_char((value #>> '{}')::timestamptz at time zone 'UTC','YYYY-MM-DD"T"HH24:MI:SS.MS"Z"') = value #>> '{}',false);
exception when others then return false;
end $$;
create function circle_private.writing_snapshot(value jsonb) returns boolean
language plpgsql set search_path = '' as $$
declare e jsonb; v jsonb; a jsonb; c jsonb; s jsonb; n integer := 0; ids text[] := '{}'; t text;
begin
  if not coalesce(circle_private.writing_keys(value, array['entry','tombstone']),false) then return false; end if;
  if value->'entry' = 'null'::jsonb then
    e := value->'tombstone';
    if not coalesce(circle_private.writing_keys(e,array['id','generation','deletedAt','usage']) or
      circle_private.writing_keys(e,array['id','generation','deletedAt']),false) then return false; end if;
    if e ? 'usage' then
      s := e->'usage';
      if jsonb_typeof(s) <> 'object' or not s ?& array['kind','answeredAt'] or
        s - array['kind','answeredAt','questionId','question'] <> '{}'::jsonb or
        s->>'kind' not in ('note','thought','deep-thought','reading-answer') then return false; end if;
      if s ?| array['questionId','question'] and s->>'kind' <> 'deep-thought' then return false; end if;
      for t in select jsonb_object_keys(s) loop
        if jsonb_typeof(s->t) <> 'string' then return false; end if;
      end loop;
      if not circle_private.writing_time(s->'answeredAt') then return false; end if;
    end if;
    if not circle_private.writing_time(e->'deletedAt') then return false; end if;
  else
    if value->'tombstone' <> 'null'::jsonb then return false; end if;
    e := value->'entry';
    if not coalesce(circle_private.writing_keys(e,array['id','kind','source','startedAt','createdAt',
      'updatedAt','status','generation','currentVersionId','versions']),false) or
      jsonb_typeof(e->'kind') <> 'string' or jsonb_typeof(e->'status') <> 'string' or
      e->>'kind' not in ('note','thought','deep-thought','reading-answer') or
      e->>'status' not in ('active','trashed') or jsonb_typeof(e->'versions') <> 'array' or
      jsonb_array_length(e->'versions') < 1 then return false; end if;
    s := e->'source';
    if s <> 'null'::jsonb then
      if jsonb_typeof(s) <> 'object' or s - array['questionId','question','source','readingId','editionId'] <> '{}'::jsonb then return false; end if;
      for t in select jsonb_object_keys(s) loop
        if jsonb_typeof(s->t) <> 'string' then return false; end if;
      end loop;
    end if;
    if not circle_private.writing_time(e->'startedAt') or not circle_private.writing_time(e->'createdAt') or
      not circle_private.writing_time(e->'updatedAt') then return false; end if;
    for v in select * from jsonb_array_elements(e->'versions') loop
      n := n + 1;
      if not coalesce(circle_private.writing_keys(v,array['id','sequence','content','attribution','savedAt']),false) or
        jsonb_typeof(v->'id') <> 'string' or not coalesce(circle_private.writing_id(v->>'id'),false) or jsonb_typeof(v->'sequence') <> 'number' or
        (v->>'sequence')::numeric <> n or v->>'id' = any(ids) then return false; end if;
      ids := array_append(ids,v->>'id');
      if not circle_private.writing_time(v->'savedAt') then return false; end if;
      c := v->'content'; a := v->'attribution';
      if not coalesce(circle_private.writing_keys(c,array['title','body','tags']),false) or
        jsonb_typeof(c->'title') <> 'string' or jsonb_typeof(c->'body') <> 'string' or
        jsonb_typeof(c->'tags') <> 'array' or (e->>'kind' <> 'note' and c->>'title' <> '') then return false; end if;
      if exists(select 1 from jsonb_array_elements(c->'tags') tag where jsonb_typeof(tag) <> 'string') then return false; end if;
      if not coalesce(circle_private.writing_keys(a,array['day','timeZone','occurrenceAt']),false) or
        jsonb_typeof(a->'day') <> 'string' or a->>'day' !~ '^\d{4}-\d{2}-\d{2}$' or
        not exists(select 1 from pg_catalog.pg_timezone_names where name = a->>'timeZone') then return false; end if;
      perform (a->>'day')::date;
      if a->'occurrenceAt' <> 'null'::jsonb and not circle_private.writing_time(a->'occurrenceAt') then return false; end if;
    end loop;
    if jsonb_typeof(e->'currentVersionId') <> 'string' or not coalesce(circle_private.writing_id(e->>'currentVersionId'),false) or e->>'currentVersionId' <> ids[n] then return false; end if;
  end if;
  return jsonb_typeof(e->'id') = 'string' and coalesce(circle_private.writing_id(e->>'id'),false) and jsonb_typeof(e->'generation') = 'number'
    and (e->>'generation')::numeric between 1 and 9007199254740991
    and (e->>'generation')::numeric = trunc((e->>'generation')::numeric);
exception when others then return false;
end $$;

create function circle_private.writing_account() returns uuid
language plpgsql stable set search_path = '' as $$
declare who uuid := auth.uid();
begin
  -- A service-role request is deliberately not a user-scoped transport.
  if who is null or auth.role() is distinct from 'authenticated' or not exists
    (select 1 from auth.users where id = who and email_confirmed_at is not null) then
    raise exception 'An authenticated account is required' using errcode = '42501';
  end if;
  return who;
end $$;

create function circle_private.writing_head_json(h circle_private.writing_heads) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('owner','account:' || h.owner_id::text,'entryId',h.entry_id,
    'serverVersion',h.server_version,'snapshot',h.snapshot)
$$;
create function circle_private.writing_receipt_json(r circle_private.writing_receipts) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('owner','account:' || r.owner_id::text,'operationId',r.operation_id,
    'entryId',r.entry_id,'fingerprint',r.fingerprint,'generation',r.generation,
    'receiptId',r.receipt_id::text,'serverVersion',r.server_version)
$$;

create function public.circle_writing_inventory(after_id text default '', page_size integer default 50) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare who uuid := circle_private.writing_account(); result jsonb;
begin
  if after_id is null or page_size not between 1 and 100 then raise exception 'Invalid inventory page'; end if;
  select coalesce(jsonb_agg(circle_private.writing_head_json(h) order by h.entry_id),'[]'::jsonb) into result
    from (select * from circle_private.writing_heads where owner_id = who and entry_id > after_id order by entry_id limit page_size) h;
  return result;
end $$;
create function public.circle_writing_receipts(operation_ids text[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare who uuid := circle_private.writing_account(); result jsonb;
begin
  if operation_ids is null or cardinality(operation_ids) > 1000 then raise exception 'Invalid receipt page'; end if;
  select coalesce(jsonb_agg(circle_private.writing_receipt_json(r) order by server_version),'[]'::jsonb) into result
    from circle_private.writing_receipts r where owner_id = who and operation_id = any(operation_ids);
  return result;
end $$;

create function public.circle_writing_apply(request jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  who uuid := circle_private.writing_account(); h circle_private.writing_heads;
  r circle_private.writing_receipts; old_conflict circle_private.writing_conflicts;
  eid text; rid text; rhash text; op jsonb; snap jsonb; item jsonb; base bigint; revision bigint;
  prior_count integer := 0; results jsonb := '[]'; seen text[] := '{}'; previous_generation bigint := 0;
begin
  if request is null or octet_length(request::text) > 2097152 or
    not coalesce(circle_private.writing_keys(request,array['requestId','entryId','baseServerVersion','snapshot','changes']),false) then
    raise exception 'Invalid writing request';
  end if;
  eid := request->>'entryId'; rid := request->>'requestId'; snap := request->'snapshot';
  if not coalesce(circle_private.writing_id(eid),false) or jsonb_typeof(request->'entryId') <> 'string' or
    jsonb_typeof(request->'requestId') <> 'string' or rid !~ '^[a-f0-9]{64}$' or
    not circle_private.writing_snapshot(snap) or coalesce(snap->'entry'->>'id',snap->'tombstone'->>'id') <> eid or
    jsonb_typeof(request->'changes') <> 'array' or jsonb_array_length(request->'changes') not between 1 and 1000 or
    jsonb_typeof(request->'baseServerVersion') <> 'number' then raise exception 'Invalid writing request'; end if;
  base := (request->>'baseServerVersion')::bigint;
  if base < 0 or base > 9007199254740991 or (request->>'baseServerVersion')::numeric <> base then raise exception 'Invalid server version'; end if;
  rhash := encode(sha256(convert_to((request - 'requestId')::text,'UTF8')),'hex');
  -- Account-wide serialization also protects operation IDs reused across entries.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(who::text,0));
  select * into h from circle_private.writing_heads where owner_id = who and entry_id = eid for update;
  revision := coalesce(h.server_version,0);
  for op in select * from jsonb_array_elements(request->'changes') loop
    if not coalesce(circle_private.writing_keys(op,array['operationId','fingerprint','generation']),false) or
      not coalesce(circle_private.writing_id(op->>'operationId'),false) or op->>'operationId' = any(seen) or
      jsonb_typeof(op->'operationId') <> 'string' or jsonb_typeof(op->'fingerprint') <> 'string' or
      op->>'fingerprint' !~ '^[a-f0-9]{64}$' or jsonb_typeof(op->'generation') <> 'number' or
      (op->>'generation')::numeric <> (op->>'generation')::bigint or
      (op->>'generation')::bigint <= previous_generation then raise exception 'Invalid writing change'; end if;
    previous_generation := (op->>'generation')::bigint;
    seen := array_append(seen,op->>'operationId');
    select * into r from circle_private.writing_receipts where owner_id = who and operation_id = op->>'operationId';
    if found then
      if r.entry_id <> eid or r.fingerprint <> op->>'fingerprint' or r.generation <> previous_generation or
        r.request_id <> rid or r.request_hash <> rhash then raise exception 'Writing operation ID reused'; end if;
      prior_count := prior_count + 1;
      results := results || jsonb_build_array(circle_private.writing_receipt_json(r));
    end if;
  end loop;
  if previous_generation <> coalesce(snap->'entry'->>'generation',snap->'tombstone'->>'generation')::bigint then raise exception 'Writing generation mismatch'; end if;
  if prior_count > 0 then
    if prior_count <> cardinality(seen) then raise exception 'Partial writing retry'; end if;
    return jsonb_build_object('status','accepted','receipts',results);
  end if;
  if h.snapshot->'tombstone' <> 'null'::jsonb then
    return jsonb_build_object('status','deleted','head',circle_private.writing_head_json(h));
  end if;
  select * into old_conflict from circle_private.writing_conflicts where owner_id = who and request_id = rid;
  if found and old_conflict.request_hash <> rhash then raise exception 'Writing request ID reused'; end if;
  if (found or revision <> base) and snap->'tombstone' = 'null'::jsonb then
    insert into circle_private.writing_conflicts(owner_id,request_id,request_hash,entry_id,candidate)
      values(who,rid,rhash,eid,snap) on conflict do nothing;
    return jsonb_build_object('status','conflict','head',circle_private.writing_head_json(h));
  end if;
  if h.entry_id is not null and snap->'entry' <> 'null'::jsonb then
    item := h.snapshot->'entry';
    if (snap->'entry'->>'generation')::bigint <= (item->>'generation')::bigint then raise exception 'Writing generation did not advance'; end if;
    if item->'kind' <> snap->'entry'->'kind' or item->'source' <> snap->'entry'->'source' or
      item->'startedAt' <> snap->'entry'->'startedAt' or item->'createdAt' <> snap->'entry'->'createdAt' or
      jsonb_array_length(item->'versions') > jsonb_array_length(snap->'entry'->'versions') then raise exception 'Original writing changed'; end if;
    for base in 0..jsonb_array_length(item->'versions')-1 loop
      if item->'versions'->base::integer <> snap->'entry'->'versions'->base::integer then raise exception 'Saved writing version changed'; end if;
    end loop;
  end if;
  results := '[]';
  for op in select * from jsonb_array_elements(request->'changes') loop
    revision := revision + 1;
    insert into circle_private.writing_receipts(owner_id,operation_id,entry_id,fingerprint,generation,server_version,request_id,request_hash)
      values(who,op->>'operationId',eid,op->>'fingerprint',(op->>'generation')::bigint,revision,rid,rhash) returning * into r;
    results := results || jsonb_build_array(circle_private.writing_receipt_json(r));
  end loop;
  insert into circle_private.writing_heads values(who,eid,revision,snap)
    on conflict(owner_id,entry_id) do update set server_version=excluded.server_version,snapshot=excluded.snapshot returning * into h;
  if snap->'tombstone' <> 'null'::jsonb then
    update circle_private.writing_conflicts set candidate=null where owner_id=who and entry_id=eid;
  end if;
  return jsonb_build_object('status','accepted','receipts',results);
end $$;

revoke all on all functions in schema circle_private from public, anon, authenticated, service_role;
revoke all on function public.circle_writing_inventory(text,integer), public.circle_writing_receipts(text[]),
  public.circle_writing_apply(jsonb) from public, anon, authenticated, service_role;
grant execute on function public.circle_writing_inventory(text,integer), public.circle_writing_receipts(text[]),
  public.circle_writing_apply(jsonb) to authenticated;
commit;
