-- Phase 3 Migration 002: Triggers, authoritative derived calculations, and integrity checks

-- 1. Generic updated_at timestamp maintenance
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_vehicles_updated_at
  BEFORE UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_parts_updated_at
  BEFORE UPDATE ON public.parts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_schedules_updated_at
  BEFORE UPDATE ON public.maintenance_schedules
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_records_updated_at
  BEFORE UPDATE ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER trg_reminder_settings_updated_at
  BEFORE UPDATE ON public.reminder_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2. Auto-provision profile and reminder_settings when an auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    NULLIF(trim(COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')), '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.reminder_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Authoritative calendar-month addition with month-end clamping (ADR-009)
--    Example: 2024-01-31 + 1 month => 2024-02-29 (leap year)
--             2025-01-31 + 1 month => 2025-02-28 (non-leap year)
CREATE OR REPLACE FUNCTION public.add_calendar_months(
  p_start_date DATE,
  p_months INTEGER
)
RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_total_months INTEGER;
  v_target_year INTEGER;
  v_target_month INTEGER;
  v_last_day_of_month INTEGER;
  v_target_day INTEGER;
BEGIN
  IF p_start_date IS NULL OR p_months IS NULL OR p_months <= 0 THEN
    RETURN NULL;
  END IF;

  v_total_months := (EXTRACT(YEAR FROM p_start_date)::INTEGER * 12)
    + (EXTRACT(MONTH FROM p_start_date)::INTEGER - 1)
    + p_months;

  v_target_year := floor(v_total_months / 12.0)::INTEGER;
  v_target_month := (v_total_months % 12) + 1;

  v_last_day_of_month := EXTRACT(
    DAY FROM (
      make_date(v_target_year, v_target_month, 1)
      + INTERVAL '1 month'
      - INTERVAL '1 day'
    )
  )::INTEGER;

  v_target_day := LEAST(EXTRACT(DAY FROM p_start_date)::INTEGER, v_last_day_of_month);

  RETURN make_date(v_target_year, v_target_month, v_target_day);
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_part_expected_replacement()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.installed_on IS NOT NULL AND NEW.expected_lifespan_months IS NOT NULL THEN
    NEW.expected_replacement_on := public.add_calendar_months(
      NEW.installed_on,
      NEW.expected_lifespan_months
    );
  ELSE
    NEW.expected_replacement_on := NULL;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_parts_expected_replacement
  BEFORE INSERT OR UPDATE OF installed_on, expected_lifespan_months
  ON public.parts
  FOR EACH ROW EXECUTE FUNCTION public.sync_part_expected_replacement();

-- 4. Atomic synchronization of vehicles.current_odometer_km from odometer_readings (ADR-009)
CREATE OR REPLACE FUNCTION public.sync_vehicle_current_odometer()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_vehicle_id UUID;
  v_latest_km INTEGER;
BEGIN
  v_vehicle_id := COALESCE(NEW.vehicle_id, OLD.vehicle_id);

  SELECT reading_km
  INTO v_latest_km
  FROM public.odometer_readings
  WHERE vehicle_id = v_vehicle_id
  ORDER BY recorded_at DESC, created_at DESC
  LIMIT 1;

  UPDATE public.vehicles
  SET current_odometer_km = v_latest_km
  WHERE id = v_vehicle_id;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trg_odometer_sync_vehicle
  AFTER INSERT OR UPDATE OR DELETE
  ON public.odometer_readings
  FOR EACH ROW EXECUTE FUNCTION public.sync_vehicle_current_odometer();

-- 5. Validate maintenance_records.schedule_id belongs to the same part_id
CREATE OR REPLACE FUNCTION public.validate_maintenance_record_schedule()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_schedule_part_id UUID;
BEGIN
  IF NEW.schedule_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT part_id
  INTO v_schedule_part_id
  FROM public.maintenance_schedules
  WHERE id = NEW.schedule_id;

  IF v_schedule_part_id IS NULL OR v_schedule_part_id <> NEW.part_id THEN
    RAISE EXCEPTION 'schedule_id % does not belong to part_id %', NEW.schedule_id, NEW.part_id;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_maintenance_records_validate_schedule
  BEFORE INSERT OR UPDATE OF part_id, schedule_id
  ON public.maintenance_records
  FOR EACH ROW EXECUTE FUNCTION public.validate_maintenance_record_schedule();
