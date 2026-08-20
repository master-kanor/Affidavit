-- Permission and role changes are RPC-only; no authenticated client receives direct mutation privileges.
revoke insert, update, delete on table public.profiles from authenticated;
revoke insert, update, delete on table public.user_permissions from authenticated;
revoke insert, update, delete on table public.resource_permissions from authenticated;
