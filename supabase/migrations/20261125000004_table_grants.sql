-- Phase 3 Migration 004: Least-privilege table-level SQL grants
-- Applied when automatic API access grants are disabled on the Supabase project.
-- Keeps all RLS policies enabled and intact; never uses GRANT ALL.

-- 1. Allow roles to resolve objects in the public schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. Revoke any accidental public/anon privileges on private user-owned tables
REVOKE ALL ON TABLE
  public.profiles,
  public.vehicles,
  public.parts,
  public.maintenance_schedules,
  public.maintenance_records,
  public.odometer_readings,
  public.notifications,
  public.reminder_settings
FROM PUBLIC, anon;

-- 3. Minimum necessary privileges for the authenticated role (enforced further by RLS)
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.vehicles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.parts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.maintenance_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.maintenance_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.odometer_readings TO authenticated;

-- Notifications: authenticated users can only read and mark read/unread; inserts are server-side only
GRANT SELECT, UPDATE ON TABLE public.notifications TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.reminder_settings TO authenticated;

-- 4. Server-side notification & reminder processing privileges
GRANT SELECT, INSERT, UPDATE ON TABLE public.notifications TO service_role;

-- 5. Helper function execution
GRANT EXECUTE ON FUNCTION public.add_calendar_months(DATE, INTEGER) TO authenticated;
