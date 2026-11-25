-- Phase 3 Verification Script: Triggers, Constraints, and Dual-User RLS Isolation
-- Run inside a transaction in Supabase SQL Editor or psql; rolls back all test data at the end.

BEGIN;

-- 1. Create two isolated auth.users (triggers handle_new_user -> profiles + reminder_settings)
INSERT INTO auth.users (id, email, raw_user_meta_data)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'usera@vehiclecare.test', '{"full_name": "User A"}'),
  ('22222222-2222-2222-2222-222222222222', 'userb@vehiclecare.test', '{"full_name": "User B"}')
ON CONFLICT (id) DO NOTHING;

-- Verify trigger created profiles and reminder_settings
DO $$
BEGIN
  IF (SELECT count(*) FROM public.profiles WHERE id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')) <> 2 THEN
    RAISE EXCEPTION 'FAIL: handle_new_user did not provision both profiles';
  END IF;
  IF (SELECT count(*) FROM public.reminder_settings WHERE user_id IN ('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222')) <> 2 THEN
    RAISE EXCEPTION 'FAIL: handle_new_user did not provision both reminder_settings';
  END IF;
END $$;

-- 2. Act as User A
SET LOCAL ROLE authenticated;
SET LOCAL request.jwt.claims = '{"sub": "11111111-1111-1111-1111-111111111111", "role": "authenticated"}';

INSERT INTO public.vehicles (id, user_id, vehicle_type, brand, model, registration_number)
VALUES ('aaaa0001-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'FOUR_WHEELER', 'Honda', 'City', 'MH 12 AB 1234');

-- Verify authoritative expected_replacement_on trigger (month-end clamping & leap year)
INSERT INTO public.parts (id, vehicle_id, part_name, installed_on, expected_lifespan_months)
VALUES ('bbbb0001-0000-0000-0000-000000000001', 'aaaa0001-0000-0000-0000-000000000001', 'Battery', '2024-01-31', 1);

DO $$
DECLARE
  v_rep DATE;
BEGIN
  SELECT expected_replacement_on INTO v_rep FROM public.parts WHERE id = 'bbbb0001-0000-0000-0000-000000000001';
  IF v_rep <> DATE '2024-02-29' THEN
    RAISE EXCEPTION 'FAIL: expected 2024-02-29 for leap-year clamp, got %', v_rep;
  END IF;
END $$;

-- Verify atomic odometer sync trigger
INSERT INTO public.odometer_readings (vehicle_id, reading_km, recorded_at)
VALUES ('aaaa0001-0000-0000-0000-000000000001', 15250, now());

DO $$
DECLARE
  v_odo INTEGER;
BEGIN
  SELECT current_odometer_km INTO v_odo FROM public.vehicles WHERE id = 'aaaa0001-0000-0000-0000-000000000001';
  IF v_odo <> 15250 THEN
    RAISE EXCEPTION 'FAIL: expected current_odometer_km = 15250, got %', v_odo;
  END IF;
END $$;

-- 3. Switch to User B and verify cross-user isolation
SET LOCAL request.jwt.claims = '{"sub": "22222222-2222-2222-2222-222222222222", "role": "authenticated"}';

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM public.vehicles WHERE id = 'aaaa0001-0000-0000-0000-000000000001';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: User B can read User A vehicle';
  END IF;

  SELECT count(*) INTO v_count FROM public.parts WHERE id = 'bbbb0001-0000-0000-0000-000000000001';
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: User B can read User A part';
  END IF;
END $$;

-- User B cannot insert a part into User A's vehicle
DO $$
BEGIN
  INSERT INTO public.parts (vehicle_id, part_name)
  VALUES ('aaaa0001-0000-0000-0000-000000000001', 'Unauthorized Part');
  RAISE EXCEPTION 'FAIL: User B was able to insert part into User A vehicle';
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL; -- Expected RLS rejection
END $$;

-- User B cannot spoof User A's user_id when inserting a vehicle
DO $$
BEGIN
  INSERT INTO public.vehicles (user_id, vehicle_type, brand, model)
  VALUES ('11111111-1111-1111-1111-111111111111', 'TWO_WHEELER', 'Spoof', 'Bike');
  RAISE EXCEPTION 'FAIL: User B was able to spoof User A user_id';
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL; -- Expected RLS rejection
END $$;

-- 4. Verify anonymous role cannot read private tables (blocked at GRANT layer with 42501 or 0 rows via RLS)
SET LOCAL ROLE anon;
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT count(*) INTO v_count FROM public.vehicles;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'FAIL: anon role can read vehicles';
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    NULL; -- Expected: anon has zero table grants on private tables
END $$;

ROLLBACK;
