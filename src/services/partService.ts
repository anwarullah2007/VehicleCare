import { getSupabaseClient } from '@/lib/supabase/client';
import { normalizeSupabaseError, type ServiceResult } from '@/services/errorUtils';
import type { Part, PartStatus } from '@/types/domain';
import type { SupabaseClient } from '@supabase/supabase-js';

// Row definition matches Supabase column names (snake_case)
export interface PartRow {
  id: string;
  vehicle_id: string;
  part_name: string;
  category: string | null;
  manufacturer: string | null;
  installed_on: string | null;
  purchased_on: string | null;
  purchase_cost: number | null;
  warranty_start_on: string | null;
  warranty_expiry_on: string | null;
  expected_lifespan_months: number | null;
  expected_replacement_on: string | null;
  status: PartStatus;
  notes: string | null;
  replaced_by_part_id: string | null;
}

function mapPartRow(row: PartRow): Part {
  return {
    id: row.id,
    vehicleId: row.vehicle_id,
    partName: row.part_name,
    category: row.category,
    manufacturer: row.manufacturer,
    installedOn: row.installed_on,
    purchasedOn: row.purchased_on,
    purchaseCost: row.purchase_cost,
    warrantyStartOn: row.warranty_start_on,
    warrantyExpiryOn: row.warranty_expiry_on,
    expectedLifespanMonths: row.expected_lifespan_months,
    expectedReplacementOn: row.expected_replacement_on,
    status: row.status,
    notes: row.notes,
    replacedByPartId: row.replaced_by_part_id,
  };
}

export async function listParts(
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Part[]>> {
  try {
    const { data, error } = await client
      .from('parts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: (data as PartRow[]).map(mapPartRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export interface CreatePartInput {
  vehicleId: string;
  partName: string;
  category?: string | null;
  manufacturer?: string | null;
  installedOn?: string | null;
  purchasedOn?: string | null;
  purchaseCost?: number | null;
  warrantyStartOn?: string | null;
  warrantyExpiryOn?: string | null;
  expectedLifespanMonths?: number | null;
  expectedReplacementOn?: string | null;
  status: 'ACTIVE' | 'REPLACED' | 'REMOVED';
  notes?: string | null;
  replacedByPartId?: string | null;
}

export async function createPart(
  input: CreatePartInput,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Part>> {
  try {
    const { data, error } = await client
      .from('parts')
      .insert({
        vehicle_id: input.vehicleId,
        part_name: input.partName.trim(),
        category: input.category?.trim() || null,
        manufacturer: input.manufacturer?.trim() || null,
        installed_on: input.installedOn || null,
        purchased_on: input.purchasedOn || null,
        purchase_cost: input.purchaseCost ?? null,
        warranty_start_on: input.warrantyStartOn || null,
        warranty_expiry_on: input.warrantyExpiryOn || null,
        expected_lifespan_months: input.expectedLifespanMonths ?? null,
        expected_replacement_on: input.expectedReplacementOn || null,
        status: input.status,
        notes: input.notes?.trim() || null,
        replaced_by_part_id: input.replacedByPartId || null,
      })
      .select('*')
      .single();
    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }
    return { data: mapPartRow(data as PartRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}

export async function markPartReplaced(
  partId: string,
  replacementPartId: string,
  client: SupabaseClient = getSupabaseClient(),
): Promise<ServiceResult<Part>> {
  try {
    const { data, error } = await client
      .from('parts')
      .update({
        status: 'REPLACED',
        replaced_by_part_id: replacementPartId,
      })
      .eq('id', partId)
      .select('*')
      .single();

    if (error) {
      return { data: null, error: normalizeSupabaseError(error) };
    }

    return { data: mapPartRow(data as PartRow), error: null };
  } catch (err) {
    return { data: null, error: normalizeSupabaseError(err) };
  }
}
