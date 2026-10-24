-- AprovaQim initial schema: clients, users, posts, comments, notifications and media storage.

create schema if not exists private;
grant usage on schema private to authenticated;

-- Types

create type public.user_role as enum ('agency', 'client');
create type public.post_type as enum ('feed', 'carousel', 'reels', 'stories');
create type public.post_status as enum ('draft', 'pending', 'approved', 'changes_requested');
create type public.media_kind as enum ('image', 'video_link');
create type public.notification_type as enum ('post_sent', 'post_approved', 'changes_requested', 'new_comment');

-- Tables

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  instagram_handle text,
  logo_path text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  client_id uuid references public.clients (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now(),
  -- Client users always belong to one client; agency users never do.
  constraint profiles_client_matches_role check ((role = 'client') = (client_id is not null))
);
create index profiles_client_id_idx on public.profiles (client_id);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients (id) on delete cascade,
  type public.post_type not null,
  title text not null check (length(trim(title)) > 0),
  caption text not null default '',
  planned_date date not null,
  status public.post_status not null default 'draft',
  created_by uuid references public.profiles (id) on delete set null,
  sent_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index posts_client_date_idx on public.posts (client_id, planned_date);
create index posts_status_idx on public.posts (status);

-- Images live in Storage; videos are Google Drive links.
create table public.post_media (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  kind public.media_kind not null,
  storage_path text,
  external_url text,
  position int not null default 0,
  created_at timestamptz not null default now(),
  constraint post_media_source check (
    (kind = 'image' and storage_path is not null and external_url is null)
    or (kind = 'video_link' and external_url is not null and storage_path is null)
  )
);
create index post_media_post_idx on public.post_media (post_id, position);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  body text not null check (length(trim(body)) > 0),
  is_change_request boolean not null default false,
  created_at timestamptz not null default now()
);
create index comments_post_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  post_id uuid references public.posts (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  actor_id uuid references public.profiles (id) on delete set null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);
create index notifications_post_idx on public.notifications (post_id);

-- Helpers used by RLS (private schema, not exposed by the API)

create function private.my_role()
returns public.user_role
language sql stable security definer set search_path = ''
as $$
  select role from public.profiles where id = (select auth.uid())
$$;

create function private.my_client_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select client_id from public.profiles where id = (select auth.uid())
$$;

create function private.is_agency()
returns boolean
language sql stable security definer set search_path = ''
as $$
  select coalesce(private.my_role() = 'agency', false)
$$;

grant execute on function private.my_role(), private.my_client_id(), private.is_agency() to authenticated;

-- Row Level Security

alter table public.clients enable row level security;
alter table public.profiles enable row level security;
alter table public.posts enable row level security;
alter table public.post_media enable row level security;
alter table public.comments enable row level security;
alter table public.notifications enable row level security;

create policy "clients: agency or own client can read" on public.clients
  for select to authenticated
  using ((select private.is_agency()) or id = (select private.my_client_id()));
create policy "clients: agency can insert" on public.clients
  for insert to authenticated with check ((select private.is_agency()));
create policy "clients: agency can update" on public.clients
  for update to authenticated using ((select private.is_agency())) with check ((select private.is_agency()));
create policy "clients: agency can delete" on public.clients
  for delete to authenticated using ((select private.is_agency()));

create policy "profiles: read self, agency team and same client" on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.is_agency())
    or role = 'agency'
    or client_id = (select private.my_client_id())
  );
create policy "profiles: agency can update" on public.profiles
  for update to authenticated using ((select private.is_agency())) with check ((select private.is_agency()));
create policy "profiles: agency can delete" on public.profiles
  for delete to authenticated using ((select private.is_agency()));

-- Clients never see drafts.
create policy "posts: agency or own client (not drafts) can read" on public.posts
  for select to authenticated
  using (
    (select private.is_agency())
    or (client_id = (select private.my_client_id()) and status <> 'draft')
  );
create policy "posts: agency can insert" on public.posts
  for insert to authenticated with check ((select private.is_agency()));
create policy "posts: agency can update" on public.posts
  for update to authenticated using ((select private.is_agency())) with check ((select private.is_agency()));
create policy "posts: agency can delete" on public.posts
  for delete to authenticated using ((select private.is_agency()));

create policy "post_media: readable when post is readable" on public.post_media
  for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "post_media: agency can insert" on public.post_media
  for insert to authenticated with check ((select private.is_agency()));
create policy "post_media: agency can update" on public.post_media
  for update to authenticated using ((select private.is_agency())) with check ((select private.is_agency()));
create policy "post_media: agency can delete" on public.post_media
  for delete to authenticated using ((select private.is_agency()));

create policy "comments: readable when post is readable" on public.comments
  for select to authenticated
  using (exists (select 1 from public.posts p where p.id = post_id));
create policy "comments: write own on readable post" on public.comments
  for insert to authenticated
  with check (
    author_id = (select auth.uid())
    and is_change_request = false
    and exists (select 1 from public.posts p where p.id = post_id)
  );
create policy "comments: delete own" on public.comments
  for delete to authenticated using (author_id = (select auth.uid()));

create policy "notifications: read own" on public.notifications
  for select to authenticated using (user_id = (select auth.uid()));
create policy "notifications: mark own as read" on public.notifications
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

grant select, insert, update, delete on all tables in schema public to authenticated;

-- Client decision on a pending post (approve or request changes with a note).

create function public.decide_post(p_post_id uuid, p_decision public.post_status, p_note text default null)
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  if p_decision not in ('approved', 'changes_requested') then
    raise exception 'invalid decision';
  end if;
  if p_decision = 'changes_requested' and coalesce(trim(p_note), '') = '' then
    raise exception 'a note is required to request changes';
  end if;

  update public.posts
     set status = p_decision, decided_at = now(), decided_by = (select auth.uid())
   where id = p_post_id
     and client_id = private.my_client_id()
     and status = 'pending';
  if not found then
    raise exception 'post not found or not pending';
  end if;

  if p_decision = 'changes_requested' then
    insert into public.comments (post_id, author_id, body, is_change_request)
    values (p_post_id, (select auth.uid()), trim(p_note), true);
  end if;
end;
$$;
revoke execute on function public.decide_post(uuid, public.post_status, text) from public, anon;
grant execute on function public.decide_post(uuid, public.post_status, text) to authenticated;

-- Triggers

create function private.set_updated_at()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger posts_set_updated_at before update on public.posts
  for each row execute function private.set_updated_at();

-- Creates a profile only for users created by the server with app_metadata.role.
create function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.raw_app_meta_data ? 'role' then
    insert into public.profiles (id, role, client_id, full_name)
    values (
      new.id,
      (new.raw_app_meta_data ->> 'role')::public.user_role,
      nullif(new.raw_app_meta_data ->> 'client_id', '')::uuid,
      coalesce(new.raw_user_meta_data ->> 'full_name', '')
    );
  end if;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- Notifies the client when posts are sent, and the agency when the client decides.
create function private.notify_post_status()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.status is not distinct from old.status then
    return new;
  end if;

  if new.status = 'pending' then
    insert into public.notifications (user_id, type, post_id, client_id, actor_id)
    select p.id, 'post_sent', new.id, new.client_id, (select auth.uid())
      from public.profiles p
     where p.role = 'client' and p.client_id = new.client_id;
  elsif new.status in ('approved', 'changes_requested') then
    insert into public.notifications (user_id, type, post_id, client_id, actor_id)
    select p.id,
           case new.status when 'approved' then 'post_approved' else 'changes_requested' end::public.notification_type,
           new.id, new.client_id, (select auth.uid())
      from public.profiles p
     where p.role = 'agency';
  end if;
  return new;
end;
$$;
create trigger posts_notify_status after insert or update of status on public.posts
  for each row execute function private.notify_post_status();

-- Notifies the other side when someone comments (change requests are notified by status).
create function private.notify_comment()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_post public.posts;
  v_author_role public.user_role;
begin
  if new.is_change_request then
    return new;
  end if;

  select * into v_post from public.posts where id = new.post_id;
  select role into v_author_role from public.profiles where id = new.author_id;

  if v_author_role = 'agency' then
    if v_post.status <> 'draft' then
      insert into public.notifications (user_id, type, post_id, client_id, actor_id)
      select p.id, 'new_comment', new.post_id, v_post.client_id, new.author_id
        from public.profiles p
       where p.role = 'client' and p.client_id = v_post.client_id;
    end if;
  else
    insert into public.notifications (user_id, type, post_id, client_id, actor_id)
    select p.id, 'new_comment', new.post_id, v_post.client_id, new.author_id
      from public.profiles p
     where p.role = 'agency';
  end if;
  return new;
end;
$$;
create trigger comments_notify after insert on public.comments
  for each row execute function private.notify_comment();

-- Realtime for the notification bell

alter publication supabase_realtime add table public.notifications;

-- Storage: private bucket, path = {client_id}/{post_id}/{file}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-media', 'post-media', false, 20971520, array['image/jpeg', 'image/png', 'image/webp']);

create policy "post-media: agency or client of a visible post can read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'post-media'
    and (
      (select private.is_agency())
      or exists (
        select 1 from public.posts p
         where p.id::text = (storage.foldername(name))[2]
           and p.client_id::text = (storage.foldername(name))[1]
      )
    )
  );
create policy "post-media: agency can upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'post-media' and (select private.is_agency()));
create policy "post-media: agency can update" on storage.objects
  for update to authenticated
  using (bucket_id = 'post-media' and (select private.is_agency()));
create policy "post-media: agency can delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'post-media' and (select private.is_agency()));
