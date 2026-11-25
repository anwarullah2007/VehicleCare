import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseClient } from '@/lib/supabase/client';
import { normalizeSupabaseError, type ServiceResult } from '@/services/errorUtils';
import type { Vehicle, VehicleType } from '@/types/domain';

export interface VehicleRow {
  id: string;
  user_id: string;
  vehicle_type: VehicleType;
  brand: string;
  model: string;
  registration_number: string | null;
  manufacture_year: number | null;
  purchase_date: string | null;
  current_odometer_km: number | null;
  is_archived: boolean;
}

export interface CreateVehicleInput {
  vehicleType: VehicleType;
  brand: string;
  model: string;
  registrationNumber?: string | null;
  manufactureYear?: number | null;
  purchaseDate?: string | null;
}

export interface UpdateVehicleInput {
  vehicleType: VehicleType;
  brand: string;
  model: string;
  registrationNumber?: string | null;
  manufactureYear?: number | null;
  purchaseDate?: string | null;
}

const VEHICLE_SELECT_COLUMNS =
  'id, user_id, vehicle_type, brand, model, registration_number, manufacture_year, purchase_date, current_odometer_km, is_archived';

export function mapVehicleRow(row: VehicleRow): Vehicle {
  return {
    id: row.id,
    userId: row.user_id,
    vehicleType: row.vehicle_type,
    brand: row.brand,
    model: row.model,
    registrationNumber: row.registration_number,
    manufactureYear: row.manufacture_year,
    purchaseDate: row.purchase_date,
    currentOdometerKm: row.current_odometer_km,
    isArchived: row.is_archived,
  };
}

function validateVehicleInput(input: CreateVehicleInput): string | null {
  if (!input.brand.trim()) return 'Brand is required.';
  if (!input.model.trim()) return 'Model is required.';
  if (
    input.manufactureYear !== undefined &&
    input.manufactureYear !== null &&
    (input.manufactureYear < 1900 || input.manufactureYear > 2100)
  ) {
    return 'Manufacture year must be between 1900 and 2100.';
  }
  return null;
}

export async function listVehicles(
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Vehicle[]>> {
  try {
    const { data, error } = await client
      .from('vehicles')
      .select(VEHICLE_SELECT_COLUMNS)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }

    return {
      data: (data as VehicleRow[]).map(mapVehicleRow),
      error: null,
    };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function createVehicle(
  input: CreateVehicleInput,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Vehicle>> {
  const validationError = validateVehicleInput(input);
  if (validationError) {
    return { data: null, error: { kind: 'VALIDATION', message: validationError } };
  }

  try {
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: {
          kind: 'AUTHENTICATION',
          message: 'You must be signed in to add a vehicle.',
        },
      };
    }

    const { data, error } = await client
      .from('vehicles')
      .insert({
        user_id: user.id,
        vehicle_type: input.vehicleType,
        brand: input.brand.trim(),
        model: input.model.trim(),
        registration_number: input.registrationNumber?.trim() || null,
        manufacture_year: input.manufactureYear ?? null,
        purchase_date: input.purchaseDate || null,
      })
      .select(VEHICLE_SELECT_COLUMNS)
      .single();

    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }

    return { data: mapVehicleRow(data as VehicleRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function updateVehicle(
  vehicleId: string,
  input: UpdateVehicleInput,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Vehicle>> {
  const validationError = validateVehicleInput(input);
  if (validationError) {
    return { data: null, error: { kind: 'VALIDATION', message: validationError } };
  }

  try {
    const { data, error } = await client
      .from('vehicles')
      .update({
        vehicle_type: input.vehicleType,
        brand: input.brand.trim(),
        model: input.model.trim(),
        registration_number: input.registrationNumber?.trim() || null,
        manufacture_year: input.manufactureYear ?? null,
        purchase_date: input.purchaseDate || null,
      })
      .eq('id', vehicleId)
      .select(VEHICLE_SELECT_COLUMNS)
      .single();

    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }

    return { data: mapVehicleRow(data as VehicleRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function deleteVehicle(
  vehicleId: string,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Vehicle>> {
  try {
    const { data, error } = await client
      .from('vehicles')
      .delete()
      .eq('id', vehicleId)
      .select(VEHICLE_SELECT_COLUMNS)
      .single();
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: mapVehicleRow(data as VehicleRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function setVehicleArchived(
  vehicleId: string,
  isArchived: boolean,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Vehicle>> {
  try {
    const { data, error } = await client
      .from('vehicles')
      .update({ is_archived: isArchived })
      .eq('id', vehicleId)
      .select(VEHICLE_SELECT_COLUMNS)
      .single();

    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }

    return { data: mapVehicleRow(data as VehicleRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}
