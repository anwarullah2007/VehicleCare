import { getSupabaseClient } from '@/lib/supabase/client';
import { normalizeSupabaseError, type ServiceResult } from '@/services/errorUtils';
import type { OdometerReading } from '@/types/domain';
import type { SupabaseClient } from '@supabase/supabase-js';

export interface OdometerRow {
  id: string;
  vehicle_id: string;
  reading_km: number;
  recorded_at: string;
  note: string | null;
}

function mapOdometerRow(row: OdometerRow): OdometerReading {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    readingKm: row.reading_km,
    recordedAt: row.recorded_at,
    note: row.note,
  };
}

export async function listOdometerReadings(
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<OdometerReading[]>> {
  try {
    const { data, error } = await client
      .from('odometer_readings')
      .select('*')
      .order('recorded_at', { ascending: false });
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: (data as OdometerRow[]).map(mapOdometerRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export interface CreateOdometerInput {
  vehicleId: string;
  readingKm: number;
  note?: string | null;
}

export async function createOdometerReading(
  input: CreateOdometerInput,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<OdometerReading>> {
  try {
    const { data, error } = await client
      .from('odometer_readings')
      .insert({
        vehicle_id: input.vehicleId,
        reading_km: input.readingKm,
        note: input.note?.trim() || null,
      })
      .select('*')
      .single();
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: mapOdometerRow(data as OdometerRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}
