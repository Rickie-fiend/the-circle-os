create table circle_private.chapter_sync_runs (
  owner_id uuid not null references auth.users(id) on delete cascade,
  run_id text not null,
  revision integer not null check (revision > 0),
  run jsonb not null,
  primary key (owner_id, run_id)
);

create table circle_private.chapter_sync_receipts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  request_hash bytea not null,
  revision integer not null,
  primary key (owner_id, operation_id)
);

alter table circle_private.chapter_sync_runs enable row level security;
alter table circle_private.chapter_sync_receipts enable row level security;
revoke all on circle_private.chapter_sync_runs, circle_private.chapter_sync_receipts
  from public, anon, authenticated, service_role;

create function circle_private.chapter_sync_exchange(owner uuid, operation jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := circle_private.writing_account();
  candidate jsonb := operation->'run';
  run_key text := candidate->>'runId';
  op_id uuid;
  base_revision integer;
  saved circle_private.chapter_sync_runs;
  receipt circle_private.chapter_sync_receipts;
  edition jsonb;
  request_hash bytea;
begin
  if owner is distinct from caller then
    raise exception 'Invalid Chapter owner' using errcode = '42501';
  end if;

  if operation is null then
    return coalesce((
      select jsonb_agg(jsonb_build_object('revision', r.revision, 'run', r.run) order by r.run_id)
      from circle_private.chapter_sync_runs r where r.owner_id = caller
    ), '[]'::jsonb);
  end if;

  if octet_length(operation::text) > 262144
    or jsonb_typeof(candidate->'answers') is distinct from 'array'
    or coalesce(candidate->>'status', '') not in ('in-progress', 'completed')
    or nullif(candidate->>'startedAt', '') is null
    or run_key is null
    or run_key is distinct from (candidate->>'chapterId') || '@' || (candidate->>'chapterVersion')
  then
    raise exception 'Invalid Chapter operation' using errcode = '22023';
  end if;
  op_id := (operation->>'id')::uuid;
  request_hash := sha256(convert_to(operation::text, 'UTF8'));
  base_revision := (operation->>'baseRevision')::integer;
  if op_id is null or base_revision is null or base_revision < 0 then
    raise exception 'Invalid Chapter operation' using errcode = '22023';
  end if;

  -- Serialize inventory updates and lost-reply retries for this owner only.
  perform pg_advisory_xact_lock(hashtextextended('chapter-sync:' || caller::text, 0));
  select * into receipt from circle_private.chapter_sync_receipts
    where owner_id = caller and operation_id = op_id;
  if found then
    if receipt.request_hash is distinct from request_hash then
      raise exception 'Chapter operation ID reused' using errcode = '22023';
    end if;
    return jsonb_build_object('status', 'accepted', 'revision', receipt.revision);
  end if;

  select v.content->'chapter' into edition from public.circle_content_versions v
    join public.circle_content_items i on i.id = v.id
    where i.kind = 'chapter' and v.id = candidate->>'chapterId'
      and v.version = (candidate->>'chapterVersion')::integer;
  if edition is null or not exists (
    select 1 from jsonb_array_elements(edition->'pages') p where p->>'id' = candidate->>'currentPageId'
  ) or not exists (
    select 1 from jsonb_array_elements(edition->'pages') p where p->>'id' = candidate->>'furthestPageId'
  ) then
    raise exception 'Invalid Chapter edition or page' using errcode = '22023';
  end if;

  select * into saved from circle_private.chapter_sync_runs
    where owner_id = caller and run_id = run_key;
  if coalesce(saved.revision, 0) <> base_revision or saved.run->>'status' = 'completed' then
    return jsonb_build_object('status', 'conflict', 'head',
      case when saved.revision is not null then jsonb_build_object('revision', saved.revision, 'run', saved.run) end);
  end if;
  if candidate->>'status' = 'completed' and (
    nullif(candidate->>'completedAt', '') is null
    or nullif(candidate->'imprintFinish'->>'day', '') is null
    or nullif(candidate->'imprintFinish'->>'timeZone', '') is null
  ) then
    raise exception 'Invalid Chapter finish' using errcode = '22023';
  end if;
  insert into circle_private.chapter_sync_runs values (caller, run_key, base_revision + 1, candidate)
    on conflict (owner_id, run_id) do update set revision = excluded.revision, run = excluded.run;
  insert into circle_private.chapter_sync_receipts values (caller, op_id, request_hash, base_revision + 1);
  return jsonb_build_object('status', 'accepted', 'revision', base_revision + 1);
end;
$$;

create function public.circle_chapter_sync(owner uuid, operation jsonb default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select circle_private.chapter_sync_exchange(owner, operation);
$$;

revoke all on function circle_private.chapter_sync_exchange(uuid, jsonb),
  public.circle_chapter_sync(uuid, jsonb) from public, anon, authenticated, service_role;
grant usage on schema circle_private to authenticated;
grant execute on function circle_private.chapter_sync_exchange(uuid, jsonb),
  public.circle_chapter_sync(uuid, jsonb) to authenticated;
