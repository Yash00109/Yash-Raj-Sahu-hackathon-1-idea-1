-- =============================================================================
-- SAFE ROLLBACK for 0002_availability_and_tracker.sql. Atomic and idempotent.
--
-- Removes the availability, website-booking and tracker functions. Keeps every
-- reservation, the configuration tables (booking_settings / booking_slots /
-- booking_closures) and all 0001 security. Afterwards:
--   1. re-apply 0001_reservation_backend.sql (idempotent): it restores the 0001 version
--      of staff_create_phone_reservation and the service role's INSERT on reservations
--      that the previous create-reservation function version needs;
--   2. redeploy the previous create-reservation version and undeploy lookup-reservation.
-- Until step 2 the public form and tracker fail closed (phone/WhatsApp fallback).
-- References created after 0002 keep their 12-character format.
-- =============================================================================

begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

drop function if exists public.lookup_reservation(text, text);
drop function if exists public.create_website_reservation(uuid, text, text, date, time, integer, text, text, text);
drop function if exists public.get_availability(date, integer);
drop function if exists public.seats_held(timestamp, integer);

commit;
