-- Keep the login email on profiles so the agency can list accesses.

alter table public.profiles add column email text not null default '';

update public.profiles p
   set email = u.email
  from auth.users u
 where u.id = p.id;

-- Creates a profile only for users created by the server with app_metadata.role.
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.raw_app_meta_data ? 'role' then
    insert into public.profiles (id, role, client_id, full_name, email)
    values (
      new.id,
      (new.raw_app_meta_data ->> 'role')::public.user_role,
      nullif(new.raw_app_meta_data ->> 'client_id', '')::uuid,
      coalesce(new.raw_user_meta_data ->> 'full_name', ''),
      coalesce(new.email, '')
    );
  end if;
  return new;
end;
$$;
