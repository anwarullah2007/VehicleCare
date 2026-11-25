import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { MaintenancePage } from '@/features/maintenance/MaintenancePage';
import { NotificationsPage } from '@/features/notifications/NotificationsPage';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { VehiclesPage } from '@/features/vehicles/VehiclesPage';
import { AuthPage } from '@/features/auth/AuthPage';
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
import { getCurrentSession, subscribeToAuthChanges, fetchUserProfile, signOut } from '@/services/authService';
import { listVehicles, createVehicle, updateVehicle, deleteVehicle } from '@/services/vehicleService';
import { listParts, createPart, markPartReplaced } from '@/services/partService';
import { listOdometerReadings, createOdometerReading } from '@/services/odometerService';

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
  const [activeSection, setActiveSection] = useState<NavSection>(getSectionFromHash);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [records, setRecords] = useState<MaintenanceRecord[]>([]);
  const [odometerReadings, setOdometerReadings] = useState<OdometerReading[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [settings, setSettings] = useState<ReminderSettings | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [dataLoadError, setDataLoadError] = useState<string | null>(null);

  // Auth initialization and session handling
  useEffect(() => {
    getCurrentSession().then(({ data: sess }) => {
      if (sess) {
        fetchUserProfile(sess).then(({ data }) => setProfile(data ?? null));
      }
    });
    const unsub = subscribeToAuthChanges((_event, sess) => {
      if (sess) fetchUserProfile(sess).then(({ data }) => setProfile(data ?? null));
      else setProfile(null);
    });
    return unsub;
  }, []);

  // Load user-owned garage data after authentication and clear it on sign-out.
  useEffect(() => {
    if (!profile) {
      setVehicles([]);
      setParts([]);
      setSchedules([]);
      setRecords([]);
      setOdometerReadings([]);
      setNotifications([]);
      setSettings(null);
      setDataLoadError(null);
      return;
    }

    let isCurrent = true;
    setDataLoadError(null);

    async function loadGarageData() {
      try {
        const [vehicleResult, partResult, odometerResult] = await Promise.all([
          listVehicles(),
          listParts(),
          listOdometerReadings(),
        ]);
        if (!isCurrent) return;

        const errors: string[] = [];
        if (vehicleResult.error) {
          errors.push(`Vehicles: ${vehicleResult.error.message}`);
        } else {
          setVehicles(vehicleResult.data);
        }
        if (partResult.error) {
          errors.push(`Components: ${partResult.error.message}`);
        } else {
          setParts(partResult.data);
        }
        if (odometerResult.error) {
          errors.push(`Odometer history: ${odometerResult.error.message}`);
        } else {
          setOdometerReadings(odometerResult.data);
        }
        setDataLoadError(errors.length ? errors.join(' ') : null);
      } catch (error) {
        if (isCurrent) {
          setDataLoadError(
            error instanceof Error
              ? `Unable to load garage data: ${error.message}`
              : 'Unable to load garage data.',
          );
        }
      }
    }

    void loadGarageData();
    return () => {
      isCurrent = false;
    };
  }, [profile]);

  // Initialise default reminder settings after profile loads
  useEffect(() => {
    if (profile && !settings) {
      setSettings({
        userId: profile.id,
        inAppEnabled: false,
        emailEnabled: false,
        reminderDaysBefore: [],
        reminderKmBefore: 0,
      });
    }
  }, [profile, settings]);

  // Hash navigation handling
  useEffect(() => {
    const handler = () => setActiveSection(getSectionFromHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);

  const navigateTo = (section: NavSection) => {
    window.location.hash = section;
    setActiveSection(section);
  };

  const handleSignOut = () => {
    setIsSigningOut(true);
    signOut().finally(() => setIsSigningOut(false));
  };

  const handleAddVehicle = async (
    input: Omit<Vehicle, 'id' | 'userId' | 'isArchived'>,
  ) => {
    const result = await createVehicle({
      vehicleType: input.vehicleType,
      brand: input.brand,
      model: input.model,
      registrationNumber: input.registrationNumber,
      manufactureYear: input.manufactureYear,
      purchaseDate: input.purchaseDate,
    });
    if (result.error) {
      throw new Error(result.error.message);
    }
    setVehicles(previous => [result.data, ...previous]);
  };

  const handleUpdateVehicle = async (
    vehicleId: string,
    input: Omit<Vehicle, 'id' | 'userId' | 'isArchived'>,
  ) => {
    const result = await updateVehicle(vehicleId, {
      vehicleType: input.vehicleType,
      brand: input.brand,
      model: input.model,
      registrationNumber: input.registrationNumber,
      manufactureYear: input.manufactureYear,
      purchaseDate: input.purchaseDate,
    });
    if (result.error) {
      throw new Error(result.error.message);
    }
    setVehicles(previous =>
      previous.map(vehicle => vehicle.id === vehicleId ? result.data : vehicle),
    );
  };

  const handleDeleteVehicle = async (vehicleId: string) => {
    const result = await deleteVehicle(vehicleId);
    if (result.error) {
      throw new Error(result.error.message);
    }
    const deletedPartIds = new Set(
      parts.filter(part => part.vehicleId === vehicleId).map(part => part.id),
    );
    const deletedScheduleIds = new Set(
      schedules
        .filter(schedule => deletedPartIds.has(schedule.partId))
        .map(schedule => schedule.id),
    );
    setVehicles(prev => prev.filter(v => v.id !== vehicleId));
    setParts(prev => prev.filter(p => p.vehicleId !== vehicleId));
    setOdometerReadings(prev => prev.filter(r => r.vehicleId !== vehicleId));
    setSchedules(prev => prev.filter(schedule => !deletedPartIds.has(schedule.partId)));
    setRecords(prev => prev.filter(record => !deletedPartIds.has(record.partId)));
    setNotifications(prev =>
      prev.map(notification =>
        (notification.partId && deletedPartIds.has(notification.partId)) ||
        (notification.scheduleId && deletedScheduleIds.has(notification.scheduleId))
          ? { ...notification, partId: null, scheduleId: null }
          : notification,
      ),
    );
    navigateTo('vehicles');
  };


  // Add part and persist to Supabase
  const handleAddPart = async (input: Omit<Part, 'id' | 'replacedByPartId'>) => {
    const result = await createPart(input);
    if (result.error) {
      throw new Error(result.error.message);
    }
    setParts(prev => [result.data, ...prev]);
  };

  const handleReplacePart = async (
    oldPartId: string,
    newPartInput: Omit<Part, 'id' | 'replacedByPartId'>,
    copySchedules: boolean,
  ) => {
    const createResult = await createPart(newPartInput);
    if (createResult.error) {
      throw new Error(createResult.error.message);
    }
    const replacementPart = createResult.data;
    const replaceResult = await markPartReplaced(oldPartId, replacementPart.id);
    if (replaceResult.error) {
      throw new Error(
        `The replacement component was saved, but the previous component could not be marked as replaced: ${replaceResult.error.message}`,
      );
    }
    setParts(prev => [
      replacementPart,
      ...prev.map(p =>
        p.id === oldPartId ? replaceResult.data : p,
      ),
    ]);
    if (copySchedules) {
      const copied = schedules
        .filter(s => s.partId === oldPartId && s.isActive)
        .map((s, idx) => ({
          ...s,
          id: `sch-${Date.now()}-${idx}`,
          partId: replacementPart.id,
        }));
      if (copied.length) setSchedules(prev => [...copied, ...prev]);
    }
  };

  // Add odometer reading and persist to Supabase
  const handleAddOdometerReading = async (vehicleId: string, readingKm: number, note: string) => {
    const result = await createOdometerReading({ vehicleId, readingKm, note });
    if (result.error) {
      throw new Error(result.error.message);
    }
    setOdometerReadings(prev => [result.data, ...prev]);
    setVehicles(prev =>
      prev.map(v => (v.id === vehicleId ? { ...v, currentOdometerKm: readingKm } : v)),
    );
  };

  const handleToggleSchedule = (scheduleId: string) => {
    setSchedules(prev => prev.map(s => (s.id === scheduleId ? { ...s, isActive: !s.isActive } : s)));
  };

  const handleAddSchedule = (input: Omit<MaintenanceSchedule, 'id'>) => {
    const newSchedule: MaintenanceSchedule = { ...input, id: `sch-${Date.now()}` };
    setSchedules(prev => [newSchedule, ...prev]);
  };

  const handleAddRecord = (input: Omit<MaintenanceRecord, 'id'>) => {
    const newRecord: MaintenanceRecord = { ...input, id: `rec-${Date.now()}` };
    setRecords(prev => [newRecord, ...prev]);
  };

  const handleToggleRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, isRead: !n.isRead } : n)),
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Show authentication page when no user
  if (!profile) {
    return <AuthPage />;
  }

  return (
    <AppLayout
      activeSection={activeSection}
      onNavigate={navigateTo}
      unreadCount={unreadCount}
      profile={profile}
      onSignOut={handleSignOut}
      isSigningOut={isSigningOut}
    >
      {dataLoadError ? (
        <p role="alert" className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {dataLoadError}
        </p>
      ) : null}
      {activeSection === 'dashboard' && (
        <DashboardPage
          vehicles={vehicles}
          parts={parts}
          schedules={schedules}
          notifications={notifications}
          onNavigate={navigateTo}
        />
      )}
      {activeSection === 'vehicles' && (
        <VehiclesPage
          vehicles={vehicles}
          parts={parts}
          odometerReadings={odometerReadings}
          records={records}
          onAddVehicle={handleAddVehicle}
          onUpdateVehicle={handleUpdateVehicle}
          onAddPart={handleAddPart}
          onReplacePart={handleReplacePart}
          onAddOdometerReading={handleAddOdometerReading}
          onDeleteVehicle={handleDeleteVehicle}
        />
      )}
      {activeSection === 'maintenance' && (
        <MaintenancePage
          vehicles={vehicles}
          parts={parts}
          schedules={schedules}
          records={records}
          onToggleSchedule={handleToggleSchedule}
          onAddSchedule={handleAddSchedule}
          onAddRecord={handleAddRecord}
        />
      )}
      {activeSection === 'notifications' && (
        <NotificationsPage
          notifications={notifications}
          onToggleRead={handleToggleRead}
          onMarkAllRead={handleMarkAllRead}
        />
      )}
      {activeSection === 'settings' && settings && (
        <SettingsPage
          profile={profile}
          settings={settings}
          onSaveProfile={setProfile}
          onSaveSettings={s => setSettings(s)}
        />
      )}
    </AppLayout>
  );
}

export default App;
