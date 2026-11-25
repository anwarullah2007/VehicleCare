import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import {
  MOCK_NOTIFICATIONS,
  MOCK_ODOMETER_READINGS,
  MOCK_PARTS,
  MOCK_PROFILE,
  MOCK_RECORDS,
  MOCK_REMINDER_SETTINGS,
  MOCK_SCHEDULES,
  MOCK_VEHICLES,
} from '@/data/mockData';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { MaintenancePage } from '@/features/maintenance/MaintenancePage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { VehiclesPage } from '@/features/vehicles/VehiclesPage';
import type {
  AppNotification,
  MaintenanceRecord,
  MaintenanceSchedule,
  NavSection,
  OdometerReading,
  Part,
  Profile,
  ReminderSettings,
  Vehicle,
} from '@/types/domain';

const VALID_SECTIONS: NavSection[] = [
  'dashboard',
  'vehicles',
  'maintenance',
  'notifications',
  'settings',
];

function getSectionFromHash(): NavSection {
  const raw = window.location.hash.replace('#', '') as NavSection;
  return VALID_SECTIONS.includes(raw) ? raw : 'dashboard';
}

export function App() {
  const [activeSection, setActiveSection] = useState<NavSection>(
    getSectionFromHash,
  );
  const [profile, setProfile] = useState<Profile>(MOCK_PROFILE);
  const [vehicles, setVehicles] = useState<Vehicle[]>(MOCK_VEHICLES);
  const [parts, setParts] = useState<Part[]>(MOCK_PARTS);
  const [schedules, setSchedules] =
    useState<MaintenanceSchedule[]>(MOCK_SCHEDULES);
  const [records, setRecords] = useState<MaintenanceRecord[]>(MOCK_RECORDS);
  const [odometerReadings, setOdometerReadings] = useState<OdometerReading[]>(
    MOCK_ODOMETER_READINGS,
  );
  const [notifications, setNotifications] =
    useState<AppNotification[]>(MOCK_NOTIFICATIONS);
  const [settings, setSettings] = useState<ReminderSettings>(
    MOCK_REMINDER_SETTINGS,
  );

  useEffect(() => {
    function handleHashChange() {
      setActiveSection(getSectionFromHash());
    }
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  function navigateTo(section: NavSection) {
    window.location.hash = section;
    setActiveSection(section);
  }

  function handleAddVehicle(
    input: Omit<Vehicle, 'id' | 'userId' | 'isArchived'>,
  ) {
    const newVehicle: Vehicle = {
      ...input,
      id: `veh-${Date.now()}`,
      userId: profile.id,
      isArchived: false,
    };
    setVehicles((prev) => [newVehicle, ...prev]);
  }

  function handleAddPart(input: Omit<Part, 'id' | 'replacedByPartId'>) {
    const newPart: Part = {
      ...input,
      id: `part-${Date.now()}`,
      replacedByPartId: null,
    };
    setParts((prev) => [newPart, ...prev]);
  }

  function handleReplacePart(
    oldPartId: string,
    newPartInput: Omit<Part, 'id' | 'replacedByPartId'>,
    copySchedules: boolean,
  ) {
    const newPartId = `part-${Date.now()}`;
    const newPart: Part = {
      ...newPartInput,
      id: newPartId,
      replacedByPartId: null,
    };

    setParts((prev) => [
      newPart,
      ...prev.map((p) =>
        p.id === oldPartId
          ? { ...p, status: 'REPLACED' as const, replacedByPartId: newPartId }
          : p,
      ),
    ]);

    if (copySchedules) {
      const copied = schedules
        .filter((s) => s.partId === oldPartId && s.isActive)
        .map((s, idx) => ({
          ...s,
          id: `sch-${Date.now()}-${idx}`,
          partId: newPartId,
        }));
      if (copied.length > 0) {
        setSchedules((prev) => [...copied, ...prev]);
      }
    }
  }

  function handleAddOdometerReading(
    vehicleId: string,
    readingKm: number,
    note: string,
  ) {
    const newReading: OdometerReading = {
      id: `odo-${Date.now()}`,
      vehicleId,
      readingKm,
      recordedAt: new Date().toISOString(),
      note: note || null,
    };
    setOdometerReadings((prev) => [newReading, ...prev]);
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId ? { ...v, currentOdometerKm: readingKm } : v,
      ),
    );
  }

  function handleToggleSchedule(scheduleId: string) {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === scheduleId ? { ...s, isActive: !s.isActive } : s,
      ),
    );
  }

  function handleAddSchedule(input: Omit<MaintenanceSchedule, 'id'>) {
    const newSchedule: MaintenanceSchedule = {
      ...input,
      id: `sch-${Date.now()}`,
    };
    setSchedules((prev) => [newSchedule, ...prev]);
  }

  function handleAddRecord(input: Omit<MaintenanceRecord, 'id'>) {
    const newRecord: MaintenanceRecord = {
      ...input,
      id: `rec-${Date.now()}`,
    };
    setRecords((prev) => [newRecord, ...prev]);
  }

  function handleToggleRead(notificationId: string) {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isRead: !n.isRead } : n,
      ),
    );
  }

  function handleMarkAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <AppLayout
      activeSection={activeSection}
      onNavigate={navigateTo}
      unreadCount={unreadCount}
      profile={profile}
    >
      {activeSection === 'dashboard' ? (
        <DashboardPage
          vehicles={vehicles}
          parts={parts}
          schedules={schedules}
          notifications={notifications}
          onNavigate={navigateTo}
        />
      ) : null}

      {activeSection === 'vehicles' ? (
        <VehiclesPage
          vehicles={vehicles}
          parts={parts}
          odometerReadings={odometerReadings}
          records={records}
          onAddVehicle={handleAddVehicle}
          onAddPart={handleAddPart}
          onReplacePart={handleReplacePart}
          onAddOdometerReading={handleAddOdometerReading}
        />
      ) : null}

      {activeSection === 'maintenance' ? (
        <MaintenancePage
          vehicles={vehicles}
          parts={parts}
          schedules={schedules}
          records={records}
          onToggleSchedule={handleToggleSchedule}
          onAddSchedule={handleAddSchedule}
          onAddRecord={handleAddRecord}
        />
      ) : null}

      {activeSection === 'notifications' ? (
        <NotificationsPage
          notifications={notifications}
          onToggleRead={handleToggleRead}
          onMarkAllRead={handleMarkAllRead}
        />
      ) : null}

      {activeSection === 'settings' ? (
        <SettingsPage
          profile={profile}
          settings={settings}
          onSaveProfile={setProfile}
          onSaveSettings={setSettings}
        />
      ) : null}
    </AppLayout>
  );
}

export default App;
