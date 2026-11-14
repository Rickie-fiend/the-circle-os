-- Prepared locally. Requires separate approval before hosted application.
begin;
alter table public.circle_content_items drop constraint circle_content_items_kind_check;
alter table public.circle_content_items add constraint circle_content_items_kind_check
 check(kind in ('chapter','article','routine-template','protocol-template'));

create function public.circle_template_number(v jsonb) returns boolean language sql immutable set search_path='' as $$
 select jsonb_typeof(v)='number' and (v#>>'{}')::numeric between -1.7976931348623157e308 and 1.7976931348623157e308
$$;
revoke all on function public.circle_template_number(jsonb) from public,anon,authenticated;

create function public.circle_template_valid(t jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare p jsonb; i jsonb; s jsonb; q jsonb; c jsonb; field text;
begin
 if t->>'schemaVersion' is distinct from '1' or coalesce(t->>'kind','') not in ('routine','protocol')
 or jsonb_typeof(t->'title') is distinct from 'string' or length(trim(t->>'title'))=0
 or jsonb_typeof(t->'description') is distinct from 'string'
 or jsonb_typeof(t->'pages') is distinct from 'array' or jsonb_typeof(t->'items') is distinct from 'array' then return false; end if;
 if jsonb_array_length(t->'items')=0 then return false; end if;
 if exists(select 1 from (select t->'cover' as img union all select x->'image' from jsonb_array_elements(t->'pages') x) images
 where img is not null and (jsonb_typeof(img) is distinct from 'object' or coalesce(img->>'assetId','') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' or jsonb_typeof(img->'alt') is distinct from 'string' or coalesce(length(trim(img->>'alt')),0)=0 or (img ? 'caption' and jsonb_typeof(img->'caption') is distinct from 'string'))) then return false; end if;
 if exists(select 1 from jsonb_array_elements(t->'pages') x group by x->>'id' having count(*)>1)
 or exists(select 1 from jsonb_array_elements(t->'items') x group by x->>'id' having count(*)>1)
 or exists(select 1 from jsonb_array_elements(t->'pages') x where x->>'type'<>'info' group by x->>'answerKey' having count(*)>1) then return false; end if;
 for p in select jsonb_array_elements(t->'pages') loop
  if coalesce(p->>'id','') !~ '^[a-z0-9][a-z0-9-]*$' or p->>'id' in ('template-cover','template-result')
  or coalesce(p->>'type','') not in ('info','single-choice','multi-choice','short-text','long-text','time')
  or coalesce(p->>'purpose','') not in ('content','configuration','reflection','preview')
  or (p ? 'imagePlacement' and p->>'imagePlacement' not in ('before-text','after-text')) then return false; end if;
  if p->>'purpose'='preview' and p->>'type'<>'info' then return false; end if;
  if p->>'type'<>'info' and p->>'purpose' not in ('configuration','reflection') then return false; end if;
  if exists(select 1 from jsonb_each(p) f where f.key in ('title','body','question') and jsonb_typeof(f.value)<>'string') then return false; end if;
  if p->>'type'<>'info' and (coalesce(p->>'answerKey','') !~ '^[a-z0-9][a-z0-9-]*$' or coalesce(length(trim(p->>'question')),0)=0) then return false; end if;
  if p->>'type'='info' and p->>'purpose'<>'preview' and coalesce(length(trim(p->>'title')),0)=0 and coalesce(length(trim(p->>'body')),0)=0 and not(p ? 'image') then return false; end if;
  if p ? 'inputFormat' then
   if p->>'inputFormat'<>'number' or p->>'type'<>'short-text' or not coalesce(public.circle_template_number(p->'min'),false) or not coalesce(public.circle_template_number(p->'max'),false) or (p->>'min')::numeric>(p->>'max')::numeric then return false; end if;
  end if;
  if p->>'type' in ('single-choice','multi-choice') then
   if jsonb_typeof(p->'options') is distinct from 'array' then return false; end if;
   if jsonb_array_length(p->'options')<2 or exists(select 1 from jsonb_array_elements(p->'options') o where coalesce(o->>'id','') !~ '^[a-z0-9][a-z0-9-]*$' or coalesce(length(trim(o->>'label')),0)=0)
    or exists(select 1 from jsonb_array_elements(p->'options') o group by o->>'id' having count(*)>1) then return false; end if;
  end if;
 end loop;
 for i in select jsonb_array_elements(t->'items') loop
  if i ? 'actionPattern' and (jsonb_typeof(i->'actionPattern') is distinct from 'string' or coalesce(length(trim(i->>'actionPattern')),0)=0 or regexp_replace(i->>'actionPattern','\{(target|unit|intensity)\}','','g') ~ '[{}]') then return false; end if;
  if jsonb_typeof(i->'unit') is distinct from 'string' or jsonb_typeof(i->'identity') is distinct from 'string' then return false; end if;
  if coalesce(i->>'id','') !~ '^[a-z0-9][a-z0-9-]*$' or coalesce(length(trim(i->>'action')),0)=0 then return false; end if;
  if t->>'kind'='routine' and coalesce(i->>'kind','') not in ('habit','task') then return false; end if;
  if t->>'kind'='protocol' and coalesce(i->>'kind','') not in ('non-negotiable','negotiable') then return false; end if;
  foreach field in array array['cue','target','intensity'] loop
   s:=i->field;
   if coalesce(s->>'source','') not in ('fixed','answer','scale','choice') or jsonb_typeof(s->'value') is distinct from 'string' then return false; end if;
   if s->>'source'<>'fixed' then
    select x into q from jsonb_array_elements(t->'pages') x where x->>'answerKey'=s->>'answerKey';
    if q is null or q->>'purpose'<>'configuration' or q->>'required' is distinct from 'true' or q->>'type'='info' then return false; end if;
   end if;
   if field='target' and s->>'source'='answer' and q->>'inputFormat' is distinct from 'number' then return false; end if;
   if s->>'source'='scale' then
    if field<>'target' or q->>'inputFormat' is distinct from 'number'
    or not coalesce(public.circle_template_number(s->'factor'),false) or not coalesce(public.circle_template_number(s->'offset'),false)
    or not coalesce(public.circle_template_number(s->'min'),false) or not coalesce(public.circle_template_number(s->'max'),false) then return false; end if;
    if (s->>'min')::numeric<0 or (s->>'min')::numeric>(s->>'max')::numeric then return false; end if;
   end if;
   if s->>'source'='choice' then
    if q->>'type'<>'single-choice' or jsonb_typeof(s->'choices') is distinct from 'array' then return false; end if;
    if jsonb_array_length(s->'choices')<>jsonb_array_length(q->'options')
    or exists(select 1 from jsonb_array_elements(s->'choices') x group by x->>'answer' having count(*)>1) then return false; end if;
    for c in select jsonb_array_elements(s->'choices') loop
     if not exists(select 1 from jsonb_array_elements(q->'options') o where o->>'id'=c->>'answer') or jsonb_typeof(c->'value') is distinct from 'string' or length(trim(c->>'value'))=0 then return false; end if;
     if field='target' and ((c->>'value')::double precision<0 or not public.circle_template_number(to_jsonb((c->>'value')::double precision))) then return false; end if;
    end loop;
   end if;
   if field='target' and s->>'source'='fixed' and s->>'value'<>'' then
    if (s->>'value')::double precision<0 or not public.circle_template_number(to_jsonb((s->>'value')::double precision)) then return false; end if;
   end if;
  end loop;
 end loop;
 if t->>'kind'='protocol' and not exists(select 1 from jsonb_array_elements(t->'items') x where x->>'kind'='non-negotiable') then return false; end if;
 return true;
exception when others then return false;
end $$;
revoke all on function public.circle_template_valid(jsonb) from public,anon,authenticated;

-- Keep the reviewed Chapter/Article implementation as an owner-only delegate.
alter function public.circle_catalog_change(jsonb) rename to circle_catalog_change_003;
revoke all on function public.circle_catalog_change_003(jsonb) from public,anon,authenticated;
create function public.circle_catalog_change(command jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare d public.circle_content_drafts; i public.circle_content_items; prior public.circle_content_receipts;
 item text:=command->>'id'; op uuid:=(command->>'operationId')::uuid; n integer; content jsonb; result jsonb; image jsonb; asset uuid;
begin
 if not public.circle_content_admin() then raise exception 'Admin required'; end if;
 if command->>'action'='publish' and item is not null then perform pg_advisory_xact_lock(hashtextextended('catalog:'||item,0)); end if;
 if command->>'action'<>'publish' or not(command->'draft' ? 'template') then
  if command->>'action'='publish' and exists(select 1 from public.circle_content_items where id=item and kind in ('routine-template','protocol-template')) then raise exception 'Content type cannot change'; end if;
  return public.circle_catalog_change_003(command);
 end if;
 if item is null or length(item) not between 1 and 200 or op is null or length(command::text)>500000 then raise exception 'Invalid operation'; end if;
 perform pg_advisory_xact_lock(hashtextextended('catalog:'||item,0));
 select * into prior from public.circle_content_receipts where operation_id=op;
 if found then
  if prior.payload<>command then raise exception 'Operation reused'; end if;
  return prior.result;
 end if;
 select * into i from public.circle_content_items where id=item for update;
 if coalesce(i.revision,0) is distinct from (command->>'expectedRevision')::integer then raise exception 'Catalog changed'; end if;
 select * into d from public.circle_content_drafts where id=command->>'draftId' for update;
 if d.id is null or item<>d.id or d.revision is distinct from (command->>'draftRevision')::integer or d.draft is distinct from command->'draft' then raise exception 'Draft changed'; end if;
 if d.draft ? 'article' or not public.circle_template_valid(d.draft->'template') then raise exception 'Invalid template'; end if;
 content:=jsonb_build_object('kind',(d.draft->'template'->>'kind')||'-template','template',d.draft->'template');
 if i.id is not null and (i.draft_id<>d.id or i.kind<>content->>'kind') then raise exception 'Content type or source cannot change'; end if;
 n:=coalesce(i.current_version,0)+1;
 insert into public.circle_content_versions(id,version,content) values(item,n,content);
 for image in select jsonb_path_query(content,'$.** ? (exists (@.assetId))') loop
  asset:=(image->>'assetId')::uuid;
  if coalesce(length(trim(image->>'alt')),0)=0 or not exists(select 1 from public.circle_content_assets where id=asset) or not exists(select 1 from storage.objects where bucket_id='circle-content' and name=asset::text) then raise exception 'Image unavailable'; end if;
  insert into public.circle_content_version_assets values(item,n,asset) on conflict do nothing;
 end loop;
 insert into public.circle_content_items(id,kind,draft_id,current_version) values(item,content->>'kind',d.id,n)
 on conflict(id) do update set current_version=n,revision=circle_content_items.revision+1;
 result:=jsonb_build_object('id',item,'version',n,'revision',coalesce(i.revision,0)+1);
 insert into public.circle_content_receipts values(op,command,result);
 return result;
end $$;
revoke all on function public.circle_catalog_change(jsonb) from public,anon;
grant execute on function public.circle_catalog_change(jsonb) to authenticated;

create or replace function public.circle_catalog_read(item text default null, edition integer default null) returns jsonb language plpgsql stable security definer set search_path='' as $$
begin
 if not public.circle_content_reader() then raise exception 'Sign in required'; end if;
 if item is null then
  return coalesce((select jsonb_agg(jsonb_build_object(
   'id',i.id,'kind',i.kind,'version',i.current_version,'revision',i.revision,'withdrawn',i.withdrawn,
   'title',coalesce(v.content->'template'->>'title',v.content->'article'->>'title',v.content->'chapter'->>'title'),
   'description',coalesce(v.content->'template'->>'description',v.content->'article'->>'summary',c.page->>'body'),
   'cover',coalesce(v.content->'template'->'cover',v.content->'article'->'cover',c.page->'image')
  )) from public.circle_content_items i
  join public.circle_content_versions v on v.id=i.id and v.version=i.current_version
  left join lateral (
   select page from jsonb_array_elements(coalesce(v.content->'chapter'->'pages','[]'::jsonb)) with ordinality p(page,position)
   where page->>'type'='cover' order by position limit 1
  ) c on true
  where not i.withdrawn or public.circle_content_admin()),'[]');
 end if;
 return (select jsonb_build_object('id',v.id,'version',v.version,'content',v.content,'publishedAt',v.published_at) from public.circle_content_versions v where v.id=item and v.version=edition);
end $$;
commit;
