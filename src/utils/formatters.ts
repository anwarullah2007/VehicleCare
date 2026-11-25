import type { VehicleType } from '@/types/domain';

export function formatVehicleType(type: VehicleType): string {
  return type === 'TWO_WHEELER' ? 'Two-Wheeler' : 'Four-Wheeler';
}

export function formatKm(km: number | null | undefined): string {
  if (km === null || km === undefined) return 'Not recorded';
  return `${km.toLocaleString('en-IN')} km`;
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return `₹${amount.toLocaleString('en-IN')}`;
}

export function formatDateDisplay(dateOnly: string | null | undefined): string {
  if (!dateOnly) return 'Not set';
  return dateOnly;
}
