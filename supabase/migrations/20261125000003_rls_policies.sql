-- Phase 3 Migration 003: Row Level Security (RLS) policies for all 8 user-owned tables

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.odometer_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_settings ENABLE ROW LEVEL SECURITY;

-- 1. profiles: user can select/update only their own row
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

-- 2. vehicles: user can select/insert/update/delete only rows where user_id = auth.uid()
CREATE POLICY "vehicles_select_own"
  ON public.vehicles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "vehicles_insert_own"
  ON public.vehicles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vehicles_update_own"
  ON public.vehicles FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "vehicles_delete_own"
  ON public.vehicles FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- 3. parts: access only when parent vehicle belongs to auth.uid()
CREATE POLICY "parts_select_own"
  ON public.parts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = parts.vehicle_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "parts_insert_own"
  ON public.parts FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = parts.vehicle_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "parts_update_own"
  ON public.parts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = parts.vehicle_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = parts.vehicle_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "parts_delete_own"
  ON public.parts FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = parts.vehicle_id AND v.user_id = auth.uid()
    )
  );

-- 4. maintenance_schedules: access only when parent part's vehicle belongs to auth.uid()
CREATE POLICY "schedules_select_own"
  ON public.maintenance_schedules FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_schedules.part_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "schedules_insert_own"
  ON public.maintenance_schedules FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_schedules.part_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "schedules_update_own"
  ON public.maintenance_schedules FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_schedules.part_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_schedules.part_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "schedules_delete_own"
  ON public.maintenance_schedules FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_schedules.part_id AND v.user_id = auth.uid()
    )
  );

-- 5. maintenance_records: access only when parent part's vehicle belongs to auth.uid()
CREATE POLICY "records_select_own"
  ON public.maintenance_records FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_records.part_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "records_insert_own"
  ON public.maintenance_records FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_records.part_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "records_update_own"
  ON public.maintenance_records FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_records.part_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_records.part_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "records_delete_own"
  ON public.maintenance_records FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.parts p
      JOIN public.vehicles v ON v.id = p.vehicle_id
      WHERE p.id = maintenance_records.part_id AND v.user_id = auth.uid()
    )
  );

-- 6. odometer_readings: access only when parent vehicle belongs to auth.uid()
CREATE POLICY "odometer_select_own"
  ON public.odometer_readings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = odometer_readings.vehicle_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "odometer_insert_own"
  ON public.odometer_readings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = odometer_readings.vehicle_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "odometer_update_own"
  ON public.odometer_readings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = odometer_readings.vehicle_id AND v.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = odometer_readings.vehicle_id AND v.user_id = auth.uid()
    )
  );

CREATE POLICY "odometer_delete_own"
  ON public.odometer_readings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vehicles v
      WHERE v.id = odometer_readings.vehicle_id AND v.user_id = auth.uid()
    )
  );

-- 7. notifications: user_id = auth.uid() and any referenced part/schedule must belong to user
--    Note: notification inserts are performed server-side via service_role in Edge Functions.
CREATE POLICY "notifications_select_own"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    AND (
      part_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.parts p
        JOIN public.vehicles v ON v.id = p.vehicle_id
        WHERE p.id = notifications.part_id AND v.user_id = auth.uid()
      )
    )
    AND (
      schedule_id IS NULL
      OR EXISTS (
        SELECT 1
        FROM public.maintenance_schedules s
        JOIN public.parts p ON p.id = s.part_id
        JOIN public.vehicles v ON v.id = p.vehicle_id
        WHERE s.id = notifications.schedule_id AND v.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "notifications_update_own"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 8. reminder_settings: user can select/insert/update only their own settings row
CREATE POLICY "reminder_settings_select_own"
  ON public.reminder_settings FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "reminder_settings_insert_own"
  ON public.reminder_settings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "reminder_settings_update_own"
  ON public.reminder_settings FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
