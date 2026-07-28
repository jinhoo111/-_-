-- ════════════════════════════════════════════════════════════════════════
-- security_events: allow admins to delete rows from the dashboard
-- ------------------------------------------------------------------------
-- Why
--  · 0001 deliberately shipped no DELETE policy, so the log was append-only.
--    That is right for an audit trail, but it left no way to clear the rows that
--    QA/testing produce, and those rows inflate the dashboard counters
--    ("인증 거부 N건") until real incidents are impossible to spot.
--  · Scope stays tight: admins only, same predicate as the existing read policy.
--    Regular users still have no INSERT/UPDATE/DELETE access whatsoever, and
--    writes remain service_role-only (Edge Function), so events cannot be forged.
--
-- Note: deletion is irreversible and the UI asks for a double confirmation on
-- "clear all". If a tamper-proof trail is ever required, revoke this policy and
-- archive to a separate table instead.
--
-- Apply: Supabase dashboard SQL Editor, or `supabase db push`.
-- ════════════════════════════════════════════════════════════════════════

drop policy if exists secevt_admin_delete on public.security_events;
create policy secevt_admin_delete on public.security_events
  for delete
  using (
    exists (
      select 1 from public.user_profiles p
      where p.user_id = auth.uid() and p.is_admin = true
    )
  );
