export type NavSection =
  | 'dashboard'
  | 'vehicles'
  | 'maintenance'
  | 'notifications'
  | 'settings';

export type VehicleType = 'TWO_WHEELER' | 'FOUR_WHEELER';

export type PartStatus = 'ACTIVE' | 'REPLACED' | 'REMOVED';

export type ScheduleType = 'DATE_INTERVAL' | 'ODOMETER_INTERVAL';

export type ServiceType =
  | 'SERVICE'
  | 'REPAIR'
  | 'INSPECTION'
  | 'REPLACEMENT'
  | 'OTHER';

export type NotificationType = 'WARRANTY' | 'REPLACEMENT' | 'MAINTENANCE';

export type EmailStatus = 'NOT_REQUESTED' | 'PENDING' | 'SENT' | 'FAILED';

export type StatusLabel =
  | 'Active'
  | 'Upcoming'
  | 'Due soon'
  | 'Due today'
  | 'Overdue'
  | 'Warranty expired'
  | 'Estimated replacement date passed'
  | 'Replaced'
  | 'Removed';

export interface Profile {
  id: string;
  fullName: string;
  email: string;
  timezone: string;
}

export interface Vehicle {
  id: string;
  userId: string;
  vehicleType: VehicleType;
  brand: string;
  model: string;
  registrationNumber: string | null;
  manufactureYear: number | null;
  purchaseDate: string | null;
  currentOdometerKm: number | null;
  isArchived: boolean;
}

export interface Part {
  id: string;
  vehicleId: string;
  partName: string;
  category: string | null;
  manufacturer: string | null;
  installedOn: string | null;
  purchasedOn: string | null;
  purchaseCost: number | null;
  warrantyStartOn: string | null;
  warrantyExpiryOn: string | null;
  expectedLifespanMonths: number | null;
  expectedReplacementOn: string | null;
  status: PartStatus;
  notes: string | null;
  replacedByPartId: string | null;
}

export interface MaintenanceSchedule {
  id: string;
  partId: string;
  scheduleName: string;
  scheduleType: ScheduleType;
  intervalMonths: number | null;
  intervalKm: number | null;
  lastCompletedOn: string | null;
  lastCompletedOdometerKm: number | null;
  nextDueOn: string | null;
  nextDueOdometerKm: number | null;
  isActive: boolean;
}

export interface MaintenanceRecord {
  id: string;
  partId: string;
  scheduleId: string | null;
  serviceDate: string;
  odometerKm: number | null;
  serviceType: ServiceType;
  description: string;
  cost: number | null;
}

export interface OdometerReading {
  id: string;
  vehicleId: string;
  readingKm: number;
  recordedAt: string;
  note: string | null;
}

export interface AppNotification {
  id: string;
  userId: string;
  partId: string | null;
  scheduleId: string | null;
  notificationType: NotificationType;
  title: string;
  message: string;
  dueDate: string | null;
  dueOdometerKm: number | null;
  reminderOffsetValue: number | null;
  reminderOffsetUnit: 'DAYS' | 'KILOMETRES' | null;
  isRead: boolean;
  emailStatus: EmailStatus;
  createdAt: string;
}

export interface ReminderSettings {
  userId: string;
  inAppEnabled: boolean;
  emailEnabled: boolean;
  reminderDaysBefore: number[];
  reminderKmBefore: number;
}
