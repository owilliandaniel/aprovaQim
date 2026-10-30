-- Company contact details, separate from the login e-mails in profiles.

alter table public.clients
  add column phone text,
  add column email text;
