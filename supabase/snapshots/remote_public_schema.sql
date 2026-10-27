


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE OR REPLACE FUNCTION "public"."is_current_user_staff"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
    select exists (
        select 1
        from public.staff_users
        where user_id = (select auth.uid())
    );
$$;


ALTER FUNCTION "public"."is_current_user_staff"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "guest_name" "text" NOT NULL,
    "phone" "text" NOT NULL,
    "reservation_date" "date" NOT NULL,
    "reservation_time" time without time zone NOT NULL,
    "party_size" integer NOT NULL,
    "seating_preference" "text" DEFAULT 'indoor'::"text" NOT NULL,
    "preferred_language" "text" DEFAULT 'es'::"text" NOT NULL,
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "reservations_guest_name_length" CHECK ((("char_length"(TRIM(BOTH FROM "guest_name")) >= 2) AND ("char_length"(TRIM(BOTH FROM "guest_name")) <= 100))),
    CONSTRAINT "reservations_notes_length" CHECK ((("notes" IS NULL) OR ("char_length"("notes") <= 1000))),
    CONSTRAINT "reservations_party_size" CHECK (("party_size" >= 1)),
    CONSTRAINT "reservations_phone_length" CHECK ((("char_length"(TRIM(BOTH FROM "phone")) >= 5) AND ("char_length"(TRIM(BOTH FROM "phone")) <= 30))),
    CONSTRAINT "reservations_preferred_language" CHECK (("preferred_language" = ANY (ARRAY['es'::"text", 'eu'::"text", 'en'::"text"]))),
    CONSTRAINT "reservations_seating_preference" CHECK (("seating_preference" = ANY (ARRAY['indoor'::"text", 'terrace'::"text"]))),
    CONSTRAINT "reservations_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'confirmed'::"text", 'rejected'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."reservations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_users" (
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."staff_users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."reservations"
    ADD CONSTRAINT "reservations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_users"
    ADD CONSTRAINT "staff_users_pkey" PRIMARY KEY ("user_id");



CREATE INDEX "reservations_date_time_idx" ON "public"."reservations" USING "btree" ("reservation_date", "reservation_time");



CREATE INDEX "reservations_status_idx" ON "public"."reservations" USING "btree" ("status");



ALTER TABLE ONLY "public"."staff_users"
    ADD CONSTRAINT "staff_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Staff can delete reservations" ON "public"."reservations" FOR DELETE TO "authenticated" USING (( SELECT "public"."is_current_user_staff"() AS "is_current_user_staff"));



CREATE POLICY "Staff can read reservations" ON "public"."reservations" FOR SELECT TO "authenticated" USING (( SELECT "public"."is_current_user_staff"() AS "is_current_user_staff"));



CREATE POLICY "Staff can update reservations" ON "public"."reservations" FOR UPDATE TO "authenticated" USING (( SELECT "public"."is_current_user_staff"() AS "is_current_user_staff")) WITH CHECK (( SELECT "public"."is_current_user_staff"() AS "is_current_user_staff"));



ALTER TABLE "public"."reservations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_users" ENABLE ROW LEVEL SECURITY;


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_current_user_staff"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_current_user_staff"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_current_user_staff"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_current_user_staff"() TO "service_role";



GRANT ALL ON TABLE "public"."reservations" TO "anon";
GRANT ALL ON TABLE "public"."reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."reservations" TO "service_role";



GRANT ALL ON TABLE "public"."staff_users" TO "anon";
GRANT ALL ON TABLE "public"."staff_users" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_users" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";







