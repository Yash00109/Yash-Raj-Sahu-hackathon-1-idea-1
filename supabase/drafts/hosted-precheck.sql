-- =============================================================================
-- READ-ONLY precheck before 0001_reservation_backend.sql.
--
-- * Runs inside a READ ONLY transaction that is rolled back: PostgreSQL refuses any
--   write in it. The query itself only reads catalogs and counts rows.
-- * Returns ONE result table (the Supabase SQL editor shows only the last result):
--     n | check | result | found | expected
--   result: OK     — matches the captured snapshot;
--           REVIEW — differs or needs a human look; read `found`, decide, then continue;
--           STOP   — do not apply the migration until the difference is understood.
-- * No customer details or staff email addresses are returned: only counts, names of
--   database objects and privilege lists.
-- =============================================================================

begin transaction read only;
set local statement_timeout = '30s';

with
res_cols as (
  select string_agg(column_name || ':' || data_type, ', ' order by ordinal_position) as v
  from information_schema.columns where table_schema = 'public' and table_name = 'reservations'
),
staff_cols as (
  select string_agg(column_name || ':' || data_type, ', ' order by ordinal_position) as v
  from information_schema.columns where table_schema = 'public' and table_name = 'staff_users'
),
checks_c as (
  select string_agg(conname, ', ' order by conname) as v
  from pg_constraint where conrelid = to_regclass('public.reservations') and contype = 'c'
),
lang_def as (
  select pg_get_constraintdef(oid) as v from pg_constraint
  where conrelid = to_regclass('public.reservations') and conname = 'reservations_preferred_language'
),
keys_c as (
  select string_agg(conname || ':' || contype::text, ', ' order by conname) as v
  from pg_constraint
  where conrelid in (to_regclass('public.reservations'), to_regclass('public.staff_users')) and contype in ('p', 'f', 'u', 'x')
),
lang_rows as (
  select string_agg(preferred_language || '=' || n, ', ' order by preferred_language) as v,
         bool_and(preferred_language in ('eu', 'es', 'fr', 'en', 'de')) as ok
  from (select preferred_language, count(*) as n from public.reservations group by 1) t
),
status_rows as (
  select string_agg(status || '=' || n, ', ' order by status) as v,
         bool_and(status in ('pending', 'confirmed', 'rejected', 'cancelled')) as ok
  from (select status, count(*) as n from public.reservations group by 1) t
),
rls as (
  select string_agg(c.relname || ':rls=' || c.relrowsecurity || ',force=' || c.relforcerowsecurity, '; ' order by c.relname) as v,
         bool_and(c.relrowsecurity) and count(*) = 2 as ok
  from pg_class c where c.oid in (to_regclass('public.reservations'), to_regclass('public.staff_users'))
),
table_acl as (
  select c.relname,
         case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end as grantee,
         array_agg(a.privilege_type::text order by a.privilege_type) as privs
  from pg_class c, aclexplode(c.relacl) a
  where c.oid in (to_regclass('public.reservations'), to_regclass('public.staff_users'))
  group by 1, 2
),
table_grants as (
  select string_agg(relname || '.' || grantee || '=' || array_to_string(privs, ','), '; ' order by relname, grantee) as v,
         -- Snapshot: GRANT ALL to anon, authenticated and service_role on both tables.
         count(*) filter (
           where grantee in ('anon', 'authenticated', 'service_role')
             and privs @> array['DELETE', 'INSERT', 'REFERENCES', 'SELECT', 'TRIGGER', 'TRUNCATE', 'UPDATE']
         ) = 6 as ok,
         bool_or(grantee = 'PUBLIC') as has_public
  from table_acl
),
fn_acl as (
  select p.oid, p.proname,
         coalesce(string_agg(case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end, ', '
                             order by case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end)
                  filter (where a.privilege_type = 'EXECUTE'),
                  'PUBLIC (default ACL)') as execs
  from pg_proc p
  left join lateral aclexplode(p.proacl) a on true
  where p.pronamespace = 'public'::regnamespace
  group by p.oid, p.proname
),
staff_fn as (
  select f.execs, p.prosecdef, p.proconfig,
         regexp_replace(p.prosrc, '\s+', ' ', 'g') as body,
         regexp_replace(pg_get_functiondef(p.oid), '\s+', ' ', 'g') as def
  from pg_proc p join fn_acl f on f.oid = p.oid
  where p.oid = to_regprocedure('public.is_current_user_staff()')
),
other_fns as (
  select string_agg(proname || '(' || execs || ')', '; ' order by proname) as v
  from fn_acl where proname <> 'is_current_user_staff'
),
default_acl as (
  select d.defaclrole::regrole::text as owner, d.defaclobjtype::text as objtype,
         string_agg(distinct case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end, ','
                    order by case when a.grantee = 0 then 'PUBLIC' else a.grantee::regrole::text end) as grantees
  from pg_default_acl d, aclexplode(d.defaclacl) a
  where d.defaclnamespace = 'public'::regnamespace
  group by 1, 2
),
default_privs as (
  select string_agg(owner || '/' || objtype || ':' || grantees, '; ' order by owner, objtype) as v,
         count(*) filter (where owner = 'postgres' and objtype in ('r', 'S', 'f')
                            and grantees = 'anon,authenticated,postgres,service_role') = 3 as ok
  from default_acl
),
policies as (
  select string_agg(tablename || '.' || policyname || ':' || cmd || ':' || array_to_string(roles, ','), '; ' order by tablename, policyname) as v
  from pg_policies where schemaname = 'public'
),
triggers as (
  select string_agg(c.relname || '.' || t.tgname, ', ' order by c.relname, t.tgname) as v
  from pg_trigger t join pg_class c on c.oid = t.tgrelid
  where not t.tgisinternal and c.relnamespace = 'public'::regnamespace
),
indexes as (
  select string_agg(indexname, ', ' order by indexname) as v
  from pg_indexes where schemaname = 'public'
),
already as (
  select string_agg(kind || ':' || name, ', ' order by kind, name) as v from (
    select 'column' as kind, table_name || '.' || column_name as name from information_schema.columns
     where table_schema = 'public'
       and ((table_name = 'reservations' and column_name in ('reference', 'source', 'request_id', 'created_by', 'status_changed_at', 'status_changed_by'))
         or (table_name = 'staff_users' and column_name = 'active'))
    union all
    select 'table', tablename from pg_tables where schemaname = 'public'
       and tablename in ('rate_limit_events', 'booking_settings', 'booking_slots', 'booking_closures')
    union all
    select 'function', proname from pg_proc where pronamespace = 'public'::regnamespace
       and proname in ('staff_set_reservation_status', 'staff_create_phone_reservation', 'consume_rate_limit', 'touch_updated_at', 'reservations_validate_new',
                       'seats_held', 'get_availability', 'create_website_reservation', 'lookup_reservation')
    union all
    select 'trigger', tgname from pg_trigger where tgname in ('reservations_validate_new', 'reservations_touch_updated_at')
    union all
    select 'index', indexname from pg_indexes where schemaname = 'public'
       and indexname in ('reservations_reference_key', 'reservations_request_id_key', 'reservations_created_at_idx', 'rate_limit_events_bucket_idx', 'rate_limit_events_created_at_idx')
    union all
    select 'constraint', conname from pg_constraint where conname in ('reservations_source', 'reservations_source_creator')
  ) t
),
legacy as (
  select count(*) as total,
         count(*) filter (where phone !~ '^\+?[0-9]{7,15}$') as phones_not_normalized,
         count(*) filter (where party_size > 90) as parties_over_90
  from public.reservations
),
staff as (
  select count(*) as n, count(*) filter (where u.id is null) as orphans
  from public.staff_users s left join auth.users u on u.id = s.user_id
),
owners as (
  select string_agg(c.relname || ':' || pg_get_userbyid(c.relowner), ', ' order by c.relname) as v,
         bool_and(pg_get_userbyid(c.relowner) = 'postgres') as ok
  from pg_class c where c.oid in (to_regclass('public.reservations'), to_regclass('public.staff_users'))
)
select n, "check", result, found, expected from (
  select 1 as n, 'session role' as "check",
         case when current_user = 'postgres' then 'OK' else 'STOP' end as result,
         current_user::text as found, 'postgres (owns the tables and the default privileges)' as expected
  union all
  select 2, 'table owners', case when (select ok from owners) then 'OK' else 'STOP' end,
         (select v from owners), 'reservations:postgres, staff_users:postgres'
  union all
  select 3, 'reservations columns',
         case when (select v from res_cols) = 'id:uuid, guest_name:text, phone:text, reservation_date:date, reservation_time:time without time zone, party_size:integer, seating_preference:text, preferred_language:text, notes:text, status:text, created_at:timestamp with time zone, updated_at:timestamp with time zone'
              then 'OK' else 'STOP' end,
         (select v from res_cols),
         'id:uuid, guest_name:text, phone:text, reservation_date:date, reservation_time:time without time zone, party_size:integer, seating_preference:text, preferred_language:text, notes:text, status:text, created_at:timestamp with time zone, updated_at:timestamp with time zone'
  union all
  select 4, 'staff_users columns',
         case when (select v from staff_cols) = 'user_id:uuid, created_at:timestamp with time zone' then 'OK' else 'STOP' end,
         (select v from staff_cols), 'user_id:uuid, created_at:timestamp with time zone'
  union all
  select 5, 'reservations CHECK constraints',
         case when (select v from checks_c) = 'reservations_guest_name_length, reservations_notes_length, reservations_party_size, reservations_phone_length, reservations_preferred_language, reservations_seating_preference, reservations_status'
              then 'OK' else 'STOP' end,
         (select v from checks_c),
         'reservations_guest_name_length, reservations_notes_length, reservations_party_size, reservations_phone_length, reservations_preferred_language, reservations_seating_preference, reservations_status'
  union all
  select 6, 'language constraint definition',
         case when (select v from lang_def) = 'CHECK ((preferred_language = ANY (ARRAY[''es''::text, ''eu''::text, ''en''::text])))' then 'OK'
              when (select v from lang_def) is null then 'STOP' else 'REVIEW' end,
         coalesce((select v from lang_def), '(missing)'), 'CHECK ((preferred_language = ANY (ARRAY[''es''::text, ''eu''::text, ''en''::text])))'
  union all
  select 7, 'keys and foreign keys',
         case when (select v from keys_c) = 'reservations_pkey:p, staff_users_pkey:p, staff_users_user_id_fkey:f' then 'OK' else 'REVIEW' end,
         (select v from keys_c), 'reservations_pkey:p, staff_users_pkey:p, staff_users_user_id_fkey:f'
  union all
  select 8, 'languages in existing rows', case when coalesce((select ok from lang_rows), true) then 'OK' else 'STOP' end,
         coalesce((select v from lang_rows), '(no rows)'), 'only eu, es, fr, en, de (counts are informational)'
  union all
  select 9, 'statuses in existing rows', case when coalesce((select ok from status_rows), true) then 'OK' else 'STOP' end,
         coalesce((select v from status_rows), '(no rows)'), 'only pending, confirmed, rejected, cancelled'
  union all
  select 10, 'row level security', case when (select ok from rls) then 'OK' else 'STOP' end,
         (select v from rls), 'reservations:rls=true,force=false; staff_users:rls=true,force=false'
  union all
  select 11, 'table grants',
         case when (select has_public from table_grants) then 'STOP' when (select ok from table_grants) then 'OK' else 'REVIEW' end,
         (select v from table_grants), 'anon, authenticated, service_role hold ALL on both tables (as in the snapshot; the migration narrows them); no PUBLIC grants'
  union all
  select 12, 'is_current_user_staff() EXECUTE grants',
         case when (select execs from staff_fn) = 'anon, authenticated, postgres, service_role' then 'OK'
              when (select execs from staff_fn) is null then 'STOP' else 'REVIEW' end,
         coalesce((select execs from staff_fn), '(function missing)'), 'anon, authenticated, postgres, service_role (no PUBLIC)'
  union all
  select 13, 'is_current_user_staff() definition',
         case when (select prosecdef from staff_fn)
                   and (select proconfig from staff_fn) = array['search_path=""']
                   and (select body from staff_fn) = ' select exists ( select 1 from public.staff_users where user_id = (select auth.uid()) ); '
              then 'OK'
              when (select def from staff_fn) is null then 'STOP' else 'REVIEW' end,
         coalesce((select def from staff_fn), '(function missing)'),
         'SECURITY DEFINER, search_path='''', body: select exists (select 1 from public.staff_users where user_id = (select auth.uid()))'
  union all
  select 14, 'other functions in public', case when (select v from other_fns) is null then 'OK' else 'REVIEW' end,
         coalesce((select v from other_fns), '(none)'), '(none)'
  union all
  select 15, 'default privileges in public', case when (select ok from default_privs) then 'OK' else 'REVIEW' end,
         coalesce((select v from default_privs), '(none)'),
         'postgres/S, postgres/f, postgres/r each: anon,authenticated,postgres,service_role (other owners: review)'
  union all
  select 16, 'policies',
         case when (select v from policies) = 'reservations.Staff can delete reservations:DELETE:authenticated; reservations.Staff can read reservations:SELECT:authenticated; reservations.Staff can update reservations:UPDATE:authenticated'
              then 'OK' else 'STOP' end,
         coalesce((select v from policies), '(none)'),
         'reservations.Staff can delete reservations:DELETE:authenticated; reservations.Staff can read reservations:SELECT:authenticated; reservations.Staff can update reservations:UPDATE:authenticated'
  union all
  select 17, 'triggers in public', case when (select v from triggers) is null then 'OK' else 'REVIEW' end,
         coalesce((select v from triggers), '(none)'), '(none)'
  union all
  select 18, 'indexes in public',
         case when (select v from indexes) = 'reservations_date_time_idx, reservations_pkey, reservations_status_idx, staff_users_pkey' then 'OK' else 'REVIEW' end,
         (select v from indexes), 'reservations_date_time_idx, reservations_pkey, reservations_status_idx, staff_users_pkey'
  union all
  select 19, 'objects the migration creates', case when (select v from already) is null then 'OK' else 'STOP' end,
         coalesce((select v from already), '(none)'), '(none) — anything listed means the schema has drifted or the migration already ran'
  union all
  select 20, 'legacy rows: phone format', case when (select phones_not_normalized from legacy) = 0 then 'OK' else 'REVIEW' end,
         (select phones_not_normalized || ' of ' || total from legacy),
         '0 (rows are kept and stay editable; the rule applies to new rows only)'
  union all
  select 21, 'legacy rows: more than 90 guests', case when (select parties_over_90 from legacy) = 0 then 'OK' else 'REVIEW' end,
         (select parties_over_90 || ' of ' || total from legacy),
         '0 (rows are kept and stay editable; the rule applies to new rows only)'
  union all
  select 22, 'staff accounts', case when (select n from staff) = 0 or (select orphans from staff) > 0 then 'REVIEW' else 'OK' end,
         (select n || ' staff rows, ' || orphans || ' without an auth user' from staff),
         'at least 1 staff row; 0 orphans (all become active=true)'
) checks
order by n;

rollback;
