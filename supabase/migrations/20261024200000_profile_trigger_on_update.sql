-- Auth's admin createUser inserts the user first and sets app_metadata in a later update,
-- so the profile trigger must also run on updates (and keep the email in sync).

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
    )
    on conflict (id) do update set email = excluded.email;
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_saved after insert or update of raw_app_meta_data, email on auth.users
  for each row execute function private.handle_new_user();
