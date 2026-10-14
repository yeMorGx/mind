-- This built-in helper is an event trigger, not an application RPC.
-- Keep event-trigger execution intact while removing client execution grants.
revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
