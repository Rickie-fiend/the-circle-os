create table circle_private.log_sync_heads (
  owner_id uuid not null references auth.users(id) on delete cascade,
  day date not null,
  block_id text not null,
  slot text not null,
  revision integer not null,
  cleared boolean not null,
  block jsonb not null,
  corrections jsonb not null default '[]',
  primary key (owner_id, day, block_id)
);
create unique index log_sync_active_slot on circle_private.log_sync_heads (owner_id, day, slot) where not cleared;
create table circle_private.log_sync_receipts (
  owner_id uuid not null references auth.users(id) on delete cascade,
  operation_id uuid not null,
  request_hash bytea not null,
  revision integer not null,
  primary key (owner_id, operation_id)
);
alter table circle_private.log_sync_heads enable row level security;
alter table circle_private.log_sync_receipts enable row level security;
revoke all on circle_private.log_sync_heads, circle_private.log_sync_receipts from public, anon, authenticated, service_role;

create function circle_private.log_sync_head(h circle_private.log_sync_heads) returns jsonb
language sql immutable set search_path = '' as $$
  select jsonb_build_object('dateKey', h.day, 'revision', h.revision, 'cleared', h.cleared,
    'block', h.block, 'corrections', h.corrections);
$$;
revoke all on function circle_private.log_sync_head(circle_private.log_sync_heads) from public, anon, authenticated, service_role;

create function circle_private.log_sync_exchange(owner uuid, operation jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  caller uuid := circle_private.writing_account();
  candidate jsonb := operation->'block';
  block_key text := candidate->>'id';
  slot_key text := candidate->>'start';
  day_key date;
  op_id uuid;
  base_revision integer;
  is_cleared boolean;
  correction_id text := operation->>'correctionId';
  digest bytea;
  saved circle_private.log_sync_heads;
  occupied circle_private.log_sync_heads;
  receipt circle_private.log_sync_receipts;
  history jsonb;
begin
  if owner is distinct from caller then
    raise exception 'Invalid Log owner' using errcode = '42501';
  end if;
  if operation is null then
    return coalesce((select jsonb_agg(circle_private.log_sync_head(h) order by h.day, h.block_id)
      from circle_private.log_sync_heads h where owner_id = caller), '[]'::jsonb);
  end if;
  if octet_length(operation::text) > 262144 or block_key is null or length(block_key) not between 1 and 128
    or coalesce(slot_key, '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or coalesce(candidate->>'end', '') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    or slot_key = candidate->>'end' or jsonb_typeof(candidate->'moments') is distinct from 'array'
    or exists (select 1 from jsonb_array_elements(candidate->'moments') m where jsonb_typeof(m) <> 'string')
    or coalesce(operation->>'dateKey', '') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'
    or jsonb_typeof(operation->'cleared') is distinct from 'boolean'
    or nullif(candidate->>'createdAt', '') is null or nullif(candidate->>'updatedAt', '') is null then
    raise exception 'Invalid Log operation' using errcode = '22023';
  end if;
  day_key := (operation->>'dateKey')::date;
  op_id := (operation->>'id')::uuid;
  base_revision := (operation->>'baseRevision')::integer;
  is_cleared := (operation->>'cleared')::boolean;
  if op_id is null or base_revision is null or base_revision < 0 or
     (is_cleared and (jsonb_array_length(candidate->'moments') <> 0 or
       concat(candidate->>'title', candidate->>'activity', candidate->>'note') <> '')) then
    raise exception 'Invalid Log operation' using errcode = '22023';
  end if;
  digest := sha256(convert_to(operation::text, 'UTF8'));
  perform pg_advisory_xact_lock(hashtextextended('log-sync:' || caller::text, 0));
  select * into receipt from circle_private.log_sync_receipts where owner_id = caller and operation_id = op_id;
  if found then
    if receipt.request_hash is distinct from digest then raise exception 'Log operation ID reused' using errcode = '22023'; end if;
    return jsonb_build_object('status', 'accepted', 'revision', receipt.revision);
  end if;
  select * into saved from circle_private.log_sync_heads where owner_id = caller and day = day_key and block_id = block_key;
  if coalesce(saved.revision, 0) <> base_revision or saved.cleared then
    return jsonb_build_object('status', 'conflict', 'head', case when saved.revision is not null then circle_private.log_sync_head(saved) end);
  end if;
  if not is_cleared then
    select * into occupied from circle_private.log_sync_heads
      where owner_id = caller and day = day_key and slot = slot_key and not cleared and block_id <> block_key;
    if found then return jsonb_build_object('status', 'conflict', 'head', circle_private.log_sync_head(occupied)); end if;
  end if;
  if saved.revision is null and (is_cleared or correction_id is not null) then
    raise exception 'Log entry is required before correction' using errcode = '22023';
  end if;
  if saved.revision is not null and ((saved.block->>'createdAt') is distinct from (candidate->>'createdAt')
    or (correction_id is not null and (saved.slot <> slot_key or saved.block->>'end' <> candidate->>'end'))) then
    raise exception 'Log attribution changed' using errcode = '22023';
  end if;
  history := coalesce(saved.corrections, '[]'::jsonb);
  if is_cleared or correction_id is not null then
    history := history || jsonb_build_array(jsonb_build_object('id', coalesce(correction_id, op_id::text),
      'dateKey', day_key, 'blockId', block_key, 'correctedAt', candidate->>'updatedAt', 'before', saved.block, 'after', candidate));
  end if;
  insert into circle_private.log_sync_heads values (caller, day_key, block_key, slot_key, base_revision + 1, is_cleared, candidate, history)
    on conflict (owner_id, day, block_id) do update set slot = excluded.slot, revision = excluded.revision,
      cleared = excluded.cleared, block = excluded.block, corrections = excluded.corrections;
  insert into circle_private.log_sync_receipts values (caller, op_id, digest, base_revision + 1);
  return jsonb_build_object('status', 'accepted', 'revision', base_revision + 1);
end;
$$;

create function public.circle_log_sync(owner uuid, operation jsonb default null)
returns jsonb language sql security invoker set search_path = '' as $$
  select circle_private.log_sync_exchange(owner, operation);
$$;
revoke all on function circle_private.log_sync_exchange(uuid, jsonb), public.circle_log_sync(uuid, jsonb)
  from public, anon, authenticated, service_role;
grant usage on schema circle_private to authenticated;
grant execute on function circle_private.log_sync_exchange(uuid, jsonb), public.circle_log_sync(uuid, jsonb) to authenticated;
