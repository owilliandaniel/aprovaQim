-- Clients can be deactivated: their users keep their accounts but can't see or decide on anything.

alter table public.clients add column active boolean not null default true;

-- Like my_client_id(), but null when the user's company is inactive.
create function private.my_active_client_id()
returns uuid
language sql stable security definer set search_path = ''
as $$
  select p.client_id
    from public.profiles p
    join public.clients c on c.id = p.client_id
   where p.id = (select auth.uid()) and c.active
$$;
grant execute on function private.my_active_client_id() to authenticated;

-- Posts (and through them media, comments and files) are hidden from inactive clients.
drop policy "posts: agency or own client (not drafts) can read" on public.posts;
create policy "posts: agency or own active client (not drafts) can read" on public.posts
  for select to authenticated
  using (
    (select private.is_agency())
    or (client_id = (select private.my_active_client_id()) and status <> 'draft')
  );

create or replace function public.decide_post(p_post_id uuid, p_decision public.post_status, p_note text default null)
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
     and client_id = private.my_active_client_id()
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
