-- Run once in a new Supabase project (SQL editor, as database owner).
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 role text not null default 'editor' check (role in ('admin','editor'))
);
alter table public.profiles enable row level security;
create function public.staff_role() returns text language sql stable security definer set search_path = '' as $$ select role from public.profiles where id = auth.uid() $$;
revoke all on function public.staff_role() from public;
grant execute on function public.staff_role() to authenticated;
create policy "Staff see own role" on public.profiles for select to authenticated using(id=auth.uid());
-- Roles are assigned only through the SQL editor/service backend, never through the browser.
create table public.content (
 id uuid primary key default gen_random_uuid(),
 kind text not null check(kind in ('event','article','video')),
 slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(slug)<=120),
 title_en text not null check(length(trim(title_en)) between 1 and 300),
 title_ha text not null check(length(trim(title_ha)) between 1 and 300),
 body_en text not null default '' check(length(body_en)<=50000),
 body_ha text not null default '' check(length(body_ha)<=50000),
 status text not null default 'draft' check(status in ('draft','published')),
 date date not null,
 category text not null default 'Community',
 author text not null default '',
 image text not null default '',
 url text not null default '',
 featured boolean not null default false,
 details jsonb not null default '{}'::jsonb check(jsonb_typeof(details)='object'),
 constraint publication_complete check(status='draft' or (length(trim(body_en))>0 and length(trim(body_ha))>0 and (kind<>'article' or length(trim(author))>0))),
 constraint safe_image check(image='' or image ~ '^https://' or image ~ '^assets/'),
 constraint safe_video check(kind<>'video' or url ~ '^https://(www\.)?(youtube\.com/|youtu\.be/)')
);
create index content_public_listing on public.content(kind,status,date desc);
alter table public.content enable row level security;
create policy "Read published content" on public.content for select to anon,authenticated using(status='published');
create policy "Staff read drafts" on public.content for select to authenticated using(public.staff_role() in ('admin','editor'));
create policy "Staff create drafts, admins publish" on public.content for insert to authenticated with check(public.staff_role()='admin' or (public.staff_role()='editor' and status='draft'));
create policy "Staff update drafts, admins publish" on public.content for update to authenticated using(public.staff_role()='admin' or (public.staff_role()='editor' and status='draft')) with check(public.staff_role()='admin' or (public.staff_role()='editor' and status='draft'));
create policy "Admins delete content" on public.content for delete to authenticated using(public.staff_role()='admin');
create table public.settings(id text primary key check(id='public'), value jsonb not null check(jsonb_typeof(value)='object'));
alter table public.settings enable row level security;
create policy "Read public settings" on public.settings for select to anon,authenticated using(true);
create policy "Admins insert settings" on public.settings for insert to authenticated with check(public.staff_role()='admin');
create policy "Admins update settings" on public.settings for update to authenticated using(public.staff_role()='admin') with check(public.staff_role()='admin');
insert into public.settings values('public','{"facebook_url":"","youtube_url":"","tiktok_url":"","mission_en":"A place for worship, Islamic learning and community connection in Kabama Layout, Zaria.","mission_ha":"Wurin ibada, koyon ilimin Musulunci da haɗin kan al’umma a Kabama Layout, Zariya."}');
create table public.audit_log(id bigint generated always as identity primary key, actor uuid, action text not null, created_at timestamptz not null default now());
alter table public.audit_log enable row level security;
create policy "Admins read audit trail" on public.audit_log for select to authenticated using(public.staff_role()='admin');
create function public.audit_change() returns trigger language plpgsql security definer set search_path = '' as $$ begin
 insert into public.audit_log(actor,action) values(auth.uid(),TG_TABLE_NAME||':'||TG_OP||':'||coalesce(to_jsonb(NEW)->>'id',to_jsonb(OLD)->>'id'));
 if TG_OP='DELETE' then return OLD; end if; return NEW; end $$;
create trigger content_audit after insert or update or delete on public.content for each row execute function public.audit_change();
create trigger settings_audit after insert or update or delete on public.settings for each row execute function public.audit_change();
create trigger profiles_audit after insert or update or delete on public.profiles for each row execute function public.audit_change();
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('media','media',true,5242880,array['image/jpeg','image/png','image/webp']);
create policy "Public view media" on storage.objects for select to anon,authenticated using(bucket_id='media');
create policy "Admins upload media" on storage.objects for insert to authenticated with check(bucket_id='media' and public.staff_role()='admin');
-- Intentionally no overwrite/delete policy for media: published links and original photographs stay intact.
-- Remove Supabase default grants including TRUNCATE (which bypasses row policies).
revoke all on public.content,public.settings,public.profiles,public.audit_log from anon,authenticated;
grant select on public.content,public.settings to anon;
grant select,insert,update,delete on public.content to authenticated;
grant select,insert,update on public.settings to authenticated;
grant select on public.profiles,public.audit_log to authenticated;
revoke all on function public.audit_change() from public;
