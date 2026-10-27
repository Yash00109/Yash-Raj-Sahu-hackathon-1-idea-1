-- =============================================================================
-- SAFE ROLLBACK for 0001_reservation_backend.sql (default recovery step).
--
-- Purpose: switch off the migration's new BEHAVIOUR if it misbehaves, without losing
-- data and without reopening access. It is atomic and idempotent.
--
-- It removes:  the two triggers, the trigger functions, the two staff functions and
--              consume_rate_limit.
-- It KEEPS:    every reservation row and column (reference, source, request_id,
--              created_by, status_changed_*), staff_users.active, rate_limit_events
--              (hashes only), the five-language constraint, the active-aware
--              is_current_user_staff(), the dropped DELETE/UPDATE policies, the revoked
--              grants and the tightened default privileges.
--
-- After it runs:
--   * the public form fails closed (create-reservation answers 500 → the site shows the
--     phone/WhatsApp fallback), because consume_rate_limit no longer exists;
--   * staff can still sign in and read reservations, but cannot change them from the UI.
--     Urgent changes are made by the owner in the SQL editor until the forward fix ships.
--
-- It deliberately does NOT restore the original permissive grants, the staff
-- DELETE/UPDATE policies or anon access to is_current_user_staff(). Re-applying
-- 0001_reservation_backend.sql afterwards restores the full behaviour.
--
-- Prefer a FORWARD FIX (a new reviewed migration that corrects the problem) whenever
-- the issue is a bug in one function or trigger; use this file only when the new
-- behaviour must be switched off immediately. Schema removal with data loss is a
-- separate, explicitly confirmed operation: 0001_reservation_backend.teardown.sql.
-- =============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

drop trigger if exists reservations_validate_new on public.reservations;
drop trigger if exists reservations_touch_updated_at on public.reservations;
drop function if exists public.reservations_validate_new();
drop function if exists public.touch_updated_at();
drop function if exists public.staff_set_reservation_status(uuid, text);
drop function if exists public.staff_create_phone_reservation(text, text, date, time, integer, text, text, text, text);
drop function if exists public.consume_rate_limit(text, integer, integer);

commit;
