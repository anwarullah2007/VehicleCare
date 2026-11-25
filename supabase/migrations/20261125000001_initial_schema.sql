-- Phase 3 Migration 001: Initial 8-table schema, constraints, and indexes

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. vehicles
CREATE TABLE public.vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('TWO_WHEELER', 'FOUR_WHEELER')),
  brand TEXT NOT NULL CHECK (char_length(trim(brand)) > 0 AND char_length(brand) <= 100),
  model TEXT NOT NULL CHECK (char_length(trim(model)) > 0 AND char_length(model) <= 100),
  registration_number TEXT CHECK (registration_number IS NULL OR char_length(registration_number) <= 32),
  normalized_registration_number TEXT GENERATED ALWAYS AS (
    CASE
      WHEN registration_number IS NULL OR trim(registration_number) = '' THEN NULL
      ELSE upper(regexp_replace(trim(registration_number), '\s+', '', 'g'))
    END
  ) STORED,
  manufacture_year SMALLINT CHECK (manufacture_year IS NULL OR (manufacture_year >= 1900 AND manufacture_year <= 2100)),
  purchase_date DATE,
  current_odometer_km INTEGER CHECK (current_odometer_km IS NULL OR current_odometer_km >= 0),
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_vehicles_user_reg_number
  ON public.vehicles (user_id, normalized_registration_number)
  WHERE normalized_registration_number IS NOT NULL;

CREATE INDEX idx_vehicles_user_archived
  ON public.vehicles (user_id, is_archived);

-- 3. parts
CREATE TABLE public.parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  part_name TEXT NOT NULL CHECK (char_length(trim(part_name)) > 0 AND char_length(part_name) <= 150),
  category TEXT CHECK (category IS NULL OR char_length(category) <= 100),
  manufacturer TEXT CHECK (manufacturer IS NULL OR char_length(manufacturer) <= 100),
  installed_on DATE,
  purchased_on DATE,
  purchase_cost NUMERIC(10, 2) CHECK (purchase_cost IS NULL OR purchase_cost >= 0),
  warranty_start_on DATE,
  warranty_expiry_on DATE,
  expected_lifespan_months INTEGER CHECK (expected_lifespan_months IS NULL OR expected_lifespan_months > 0),
  expected_replacement_on DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'REPLACED', 'REMOVED')),
  notes TEXT CHECK (notes IS NULL OR char_length(notes) <= 2000),
  replaced_by_part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_parts_warranty_dates CHECK (
    warranty_start_on IS NULL
    OR warranty_expiry_on IS NULL
    OR warranty_expiry_on >= warranty_start_on
  )
);

CREATE INDEX idx_parts_vehicle_status
  ON public.parts (vehicle_id, status);

CREATE INDEX idx_parts_expected_replacement
  ON public.parts (expected_replacement_on)
  WHERE expected_replacement_on IS NOT NULL;

CREATE INDEX idx_parts_warranty_expiry
  ON public.parts (warranty_expiry_on)
  WHERE warranty_expiry_on IS NOT NULL;

-- 4. maintenance_schedules
CREATE TABLE public.maintenance_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  schedule_name TEXT NOT NULL CHECK (char_length(trim(schedule_name)) > 0 AND char_length(schedule_name) <= 150),
  schedule_type TEXT NOT NULL CHECK (schedule_type IN ('DATE_INTERVAL', 'ODOMETER_INTERVAL')),
  interval_months INTEGER,
  interval_km INTEGER,
  last_completed_on DATE,
  last_completed_odometer_km INTEGER CHECK (last_completed_odometer_km IS NULL OR last_completed_odometer_km >= 0),
  next_due_on DATE,
  next_due_odometer_km INTEGER CHECK (next_due_odometer_km IS NULL OR next_due_odometer_km >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_schedule_interval_partition CHECK (
    (schedule_type = 'DATE_INTERVAL' AND interval_months IS NOT NULL AND interval_months > 0 AND interval_km IS NULL)
    OR
    (schedule_type = 'ODOMETER_INTERVAL' AND interval_km IS NOT NULL AND interval_km > 0 AND interval_months IS NULL)
  )
);

CREATE INDEX idx_schedules_part_active
  ON public.maintenance_schedules (part_id, is_active);

CREATE INDEX idx_schedules_next_due_on
  ON public.maintenance_schedules (next_due_on)
  WHERE next_due_on IS NOT NULL;

-- 5. maintenance_records
CREATE TABLE public.maintenance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part_id UUID NOT NULL REFERENCES public.parts(id) ON DELETE CASCADE,
  schedule_id UUID REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  service_date DATE NOT NULL,
  odometer_km INTEGER CHECK (odometer_km IS NULL OR odometer_km >= 0),
  service_type TEXT NOT NULL CHECK (service_type IN ('SERVICE', 'REPAIR', 'INSPECTION', 'REPLACEMENT', 'OTHER')),
  description TEXT NOT NULL CHECK (char_length(trim(description)) > 0 AND char_length(description) <= 2000),
  cost NUMERIC(10, 2) CHECK (cost IS NULL OR cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_records_part_service_date
  ON public.maintenance_records (part_id, service_date DESC);

-- 6. odometer_readings
CREATE TABLE public.odometer_readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  reading_km INTEGER NOT NULL CHECK (reading_km >= 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  note TEXT CHECK (note IS NULL OR char_length(note) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_odometer_vehicle_recorded_at
  ON public.odometer_readings (vehicle_id, recorded_at DESC);

-- 7. notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  part_id UUID REFERENCES public.parts(id) ON DELETE SET NULL,
  schedule_id UUID REFERENCES public.maintenance_schedules(id) ON DELETE SET NULL,
  notification_type TEXT NOT NULL CHECK (notification_type IN ('WARRANTY', 'REPLACEMENT', 'MAINTENANCE')),
  title TEXT NOT NULL CHECK (char_length(trim(title)) > 0 AND char_length(title) <= 200),
  message TEXT NOT NULL CHECK (char_length(trim(message)) > 0 AND char_length(message) <= 1000),
  due_date DATE,
  due_odometer_km INTEGER CHECK (due_odometer_km IS NULL OR due_odometer_km >= 0),
  reminder_offset_value INTEGER,
  reminder_offset_unit TEXT CHECK (reminder_offset_unit IS NULL OR reminder_offset_unit IN ('DAYS', 'KILOMETRES')),
  dedupe_key TEXT NOT NULL UNIQUE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  email_status TEXT NOT NULL DEFAULT 'NOT_REQUESTED' CHECK (email_status IN ('NOT_REQUESTED', 'PENDING', 'SENT', 'FAILED')),
  email_attempts INTEGER NOT NULL DEFAULT 0 CHECK (email_attempts >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  email_sent_at TIMESTAMPTZ
);

CREATE INDEX idx_notifications_user_read_created
  ON public.notifications (user_id, is_read, created_at DESC);

-- 8. reminder_settings
CREATE TABLE public.reminder_settings (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  email_enabled BOOLEAN NOT NULL DEFAULT false,
  reminder_days_before INTEGER[] NOT NULL DEFAULT ARRAY[30, 7, 0],
  reminder_km_before INTEGER NOT NULL DEFAULT 500 CHECK (reminder_km_before > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
