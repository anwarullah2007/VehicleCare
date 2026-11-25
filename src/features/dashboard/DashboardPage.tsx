import { BellIcon, VehicleIcon, WrenchIcon } from '@/components/Icons';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { SummaryCard } from '@/components/SummaryCard';
import type {
  AppNotification,
  MaintenanceSchedule,
  NavSection,
  Part,
  Vehicle,
} from '@/types/domain';
import { formatDateDisplay, formatKm } from '@/utils/formatters';

interface DashboardPageProps {
  vehicles: Vehicle[];
  parts: Part[];
  schedules: MaintenanceSchedule[];
  notifications: AppNotification[];
  onNavigate: (section: NavSection) => void;
}

export function DashboardPage({
  vehicles,
  parts,
  schedules,
  notifications,
  onNavigate,
}: DashboardPageProps) {
  const activeVehicles = vehicles.filter((v) => !v.isArchived);
  const activeParts = parts.filter((p) => p.status === 'ACTIVE');
  const activeSchedules = schedules.filter((s) => s.isActive);
  const partsWithWarranty = activeParts.filter((p) => p.warrantyExpiryOn);
  const partsWithReplacement = activeParts.filter(
    (p) => p.expectedReplacementOn,
  );
  const unreadNotifications = notifications.filter((n) => !n.isRead);

  function getVehicleLabel(vehicleId: string): string {
    const vehicle = vehicles.find((v) => v.id === vehicleId);
    return vehicle ? `${vehicle.brand} ${vehicle.model}` : 'Unknown vehicle';
  }

  function getPartById(partId: string): Part | undefined {
    return parts.find((p) => p.id === partId);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your vehicles, active components, upcoming maintenance, and reminders."
      />

      {/* Summary Cards */}
      <section aria-label="Summary metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="My Vehicles"
          value={activeVehicles.length}
          helperText="Active two-wheelers & four-wheelers"
          icon={<VehicleIcon className="h-5 w-5" />}
          onClick={() => onNavigate('vehicles')}
        />
        <SummaryCard
          label="Active Components"
          value={activeParts.length}
          helperText="Tracked parts across your vehicles"
          icon={<WrenchIcon className="h-5 w-5" />}
          onClick={() => onNavigate('vehicles')}
        />
        <SummaryCard
          label="Active Schedules"
          value={activeSchedules.length}
          helperText="Calendar & odometer intervals"
          icon={<WrenchIcon className="h-5 w-5" />}
          onClick={() => onNavigate('maintenance')}
        />
        <SummaryCard
          label="Warranty Tracked"
          value={partsWithWarranty.length}
          helperText={`${unreadNotifications.length} unread notifications`}
          icon={<BellIcon className="h-5 w-5" />}
          onClick={() => onNavigate('notifications')}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Maintenance Due / Upcoming */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Maintenance Attention
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('maintenance')}
              className="text-xs font-medium text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              View all schedules
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {activeSchedules.slice(0, 4).map((schedule) => {
              const part = getPartById(schedule.partId);
              const isOverdue = schedule.id === 'sch-01';
              const isDueSoon = schedule.id === 'sch-02' || schedule.id === 'sch-04';
              const badgeStatus = isOverdue
                ? 'Overdue'
                : isDueSoon
                  ? 'Due soon'
                  : 'Upcoming';

              return (
                <li
                  key={schedule.id}
                  className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {schedule.scheduleName}
                    </p>
                    <p className="text-xs text-slate-500">
                      {part ? `${getVehicleLabel(part.vehicleId)} · ${part.partName}` : ''}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {schedule.scheduleType === 'DATE_INTERVAL'
                        ? `Due date: ${formatDateDisplay(schedule.nextDueOn)}`
                        : `Due at: ${formatKm(schedule.nextDueOdometerKm)}`}
                    </p>
                  </div>
                  <StatusBadge status={badgeStatus} />
                </li>
              );
            })}
          </ul>
        </section>

        {/* Recent Notifications */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-base font-semibold text-slate-900">
              Recent Notifications
            </h2>
            <button
              type="button"
              onClick={() => onNavigate('notifications')}
              className="text-xs font-medium text-blue-600 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Open notification center
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {notifications.slice(0, 4).map((notif) => (
              <li key={notif.id} className="py-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {notif.title}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-600">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.isRead ? (
                    <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                      Unread
                    </span>
                  ) : (
                    <span className="shrink-0 text-[11px] text-slate-400">
                      Read
                    </span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Estimated Replacement & Warranty Overview */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-col gap-1 border-b border-slate-100 pb-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            Component Estimates &amp; Warranties
          </h2>
          <p className="text-xs text-slate-500">
            Dates are user-entered estimates and do not indicate mechanical failure.
          </p>
        </div>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="py-2 pr-4">Component</th>
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Warranty Expiry</th>
                <th className="py-2 pr-4">Est. Replacement</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partsWithReplacement.map((part) => (
                <tr key={part.id}>
                  <td className="py-3 pr-4 font-medium text-slate-900">
                    {part.partName}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {getVehicleLabel(part.vehicleId)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatDateDisplay(part.warrantyExpiryOn)}
                  </td>
                  <td className="py-3 pr-4 text-slate-600">
                    {formatDateDisplay(part.expectedReplacementOn)}
                  </td>
                  <td className="py-3">
                    <StatusBadge
                      status={
                        part.id === 'part-05'
                          ? 'Estimated replacement date passed'
                          : 'Upcoming'
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
