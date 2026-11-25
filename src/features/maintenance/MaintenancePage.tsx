import { useState } from 'react';
import { PlusIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import type {
  MaintenanceRecord,
  MaintenanceSchedule,
  Part,
  ScheduleType,
  ServiceType,
  Vehicle,
} from '@/types/domain';
import { formatCurrency, formatDateDisplay, formatKm } from '@/utils/formatters';

interface MaintenancePageProps {
  vehicles: Vehicle[];
  parts: Part[];
  schedules: MaintenanceSchedule[];
  records: MaintenanceRecord[];
  onToggleSchedule: (scheduleId: string) => void;
  onAddSchedule: (schedule: Omit<MaintenanceSchedule, 'id'>) => void;
  onAddRecord: (record: Omit<MaintenanceRecord, 'id'>) => void;
}

export function MaintenancePage({
  vehicles,
  parts,
  schedules,
  records,
  onToggleSchedule,
  onAddSchedule,
  onAddRecord,
}: MaintenancePageProps) {
  const [activeTab, setActiveTab] = useState<'schedules' | 'history'>(
    'schedules',
  );
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showRecordModal, setShowRecordModal] = useState(false);

  const activeParts = parts.filter((p) => p.status === 'ACTIVE');

  // Schedule form state
  const [schPartId, setSchPartId] = useState(activeParts[0]?.id ?? '');
  const [schName, setSchName] = useState('');
  const [schType, setSchType] = useState<ScheduleType>('DATE_INTERVAL');
  const [intervalValue, setIntervalValue] = useState('6');
  const [nextDueOn, setNextDueOn] = useState('');
  const [nextDueKm, setNextDueKm] = useState('');

  // Record form state
  const [recPartId, setRecPartId] = useState(activeParts[0]?.id ?? '');
  const [recType, setRecType] = useState<ServiceType>('SERVICE');
  const [recDate, setRecDate] = useState('2026-11-25');
  const [recOdometer, setRecOdometer] = useState('');
  const [recDescription, setRecDescription] = useState('');
  const [recCost, setRecCost] = useState('');

  function getContextLabel(partId: string): string {
    const part = parts.find((p) => p.id === partId);
    if (!part) return 'Unknown component';
    const vehicle = vehicles.find((v) => v.id === part.vehicleId);
    return vehicle
      ? `${vehicle.brand} ${vehicle.model} · ${part.partName}`
      : part.partName;
  }

  function handleCreateSchedule(event: React.FormEvent) {
    event.preventDefault();
    if (!schPartId || !schName.trim()) return;
    const numericInterval = Number(intervalValue);
    if (numericInterval <= 0) return;

    onAddSchedule({
      partId: schPartId,
      scheduleName: schName.trim(),
      scheduleType: schType,
      intervalMonths: schType === 'DATE_INTERVAL' ? numericInterval : null,
      intervalKm: schType === 'ODOMETER_INTERVAL' ? numericInterval : null,
      lastCompletedOn: null,
      lastCompletedOdometerKm: null,
      nextDueOn: schType === 'DATE_INTERVAL' ? nextDueOn || null : null,
      nextDueOdometerKm:
        schType === 'ODOMETER_INTERVAL' && nextDueKm ? Number(nextDueKm) : null,
      isActive: true,
    });
    setSchName('');
    setNextDueOn('');
    setNextDueKm('');
    setShowScheduleModal(false);
  }

  function handleCreateRecord(event: React.FormEvent) {
    event.preventDefault();
    if (!recPartId || !recDate || !recDescription.trim()) return;
    onAddRecord({
      partId: recPartId,
      scheduleId: null,
      serviceDate: recDate,
      odometerKm: recOdometer ? Number(recOdometer) : null,
      serviceType: recType,
      description: recDescription.trim(),
      cost: recCost ? Number(recCost) : null,
    });
    setRecDescription('');
    setRecOdometer('');
    setRecCost('');
    setShowRecordModal(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Maintenance"
        description="Manage calendar or distance maintenance schedules and preserve service history."
        actions={
          activeTab === 'schedules' ? (
            <button
              type="button"
              onClick={() => setShowScheduleModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="h-4 w-4" />
              Add Schedule
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowRecordModal(true)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              <PlusIcon className="h-4 w-4" />
              Log Service Record
            </button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'schedules'}
          onClick={() => setActiveTab('schedules')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'schedules'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Schedules ({schedules.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'history'}
          onClick={() => setActiveTab('history')}
          className={`border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'history'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          Service History ({records.length})
        </button>
      </div>

      {activeTab === 'schedules' ? (
        <div className="space-y-3">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">
                    {sch.scheduleName}
                  </h2>
                  <StatusBadge status={sch.isActive ? 'Active' : 'Removed'} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {getContextLabel(sch.partId)}
                </p>
                <p className="mt-1.5 text-sm text-slate-700">
                  {sch.scheduleType === 'DATE_INTERVAL'
                    ? `Every ${sch.intervalMonths} months · Next due: ${formatDateDisplay(sch.nextDueOn)}`
                    : `Every ${formatKm(sch.intervalKm)} · Next due at: ${formatKm(sch.nextDueOdometerKm)}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onToggleSchedule(sch.id)}
                className="self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 sm:self-center"
              >
                {sch.isActive ? 'Pause' : 'Resume'}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Vehicle &amp; Component</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Odometer</th>
                <th className="px-4 py-3">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {records.map((rec) => (
                <tr key={rec.id}>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {rec.serviceDate}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {getContextLabel(rec.partId)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{rec.serviceType}</td>
                  <td className="px-4 py-3 text-slate-700">{rec.description}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                    {formatKm(rec.odometerKm)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                    {formatCurrency(rec.cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Schedule Modal */}
      <Modal
        isOpen={showScheduleModal}
        title="Add Maintenance Schedule"
        description="Choose either a calendar interval or an odometer interval (separate rules in MVP)."
        onClose={() => setShowScheduleModal(false)}
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label
              htmlFor="sch-part"
              className="block text-sm font-medium text-slate-700"
            >
              Component *
            </label>
            <select
              id="sch-part"
              value={schPartId}
              onChange={(e) => setSchPartId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {activeParts.map((part) => (
                <option key={part.id} value={part.id}>
                  {getContextLabel(part.id)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="sch-name"
              className="block text-sm font-medium text-slate-700"
            >
              Schedule Name *
            </label>
            <input
              id="sch-name"
              type="text"
              required
              value={schName}
              onChange={(e) => setSchName(e.target.value)}
              placeholder="e.g. Air Filter Cleaning"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="sch-type"
              className="block text-sm font-medium text-slate-700"
            >
              Schedule Type *
            </label>
            <select
              id="sch-type"
              value={schType}
              onChange={(e) => setSchType(e.target.value as ScheduleType)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="DATE_INTERVAL">Calendar Interval (Months)</option>
              <option value="ODOMETER_INTERVAL">Distance Interval (km)</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="sch-interval"
                className="block text-sm font-medium text-slate-700"
              >
                {schType === 'DATE_INTERVAL'
                  ? 'Interval (months) *'
                  : 'Interval (km) *'}
              </label>
              <input
                id="sch-interval"
                type="number"
                min={1}
                required
                value={intervalValue}
                onChange={(e) => setIntervalValue(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            {schType === 'DATE_INTERVAL' ? (
              <div>
                <label
                  htmlFor="sch-next-date"
                  className="block text-sm font-medium text-slate-700"
                >
                  Next Due Date
                </label>
                <input
                  id="sch-next-date"
                  type="date"
                  value={nextDueOn}
                  onChange={(e) => setNextDueOn(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            ) : (
              <div>
                <label
                  htmlFor="sch-next-km"
                  className="block text-sm font-medium text-slate-700"
                >
                  Next Due Odometer (km)
                </label>
                <input
                  id="sch-next-km"
                  type="number"
                  min={0}
                  value={nextDueKm}
                  onChange={(e) => setNextDueKm(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowScheduleModal(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Schedule
            </button>
          </div>
        </form>
      </Modal>

      {/* Log Service Record Modal */}
      <Modal
        isOpen={showRecordModal}
        title="Log Maintenance Record"
        description="Record completed service, repair, inspection, or replacement."
        onClose={() => setShowRecordModal(false)}
      >
        <form onSubmit={handleCreateRecord} className="space-y-4">
          <div>
            <label
              htmlFor="rec-part"
              className="block text-sm font-medium text-slate-700"
            >
              Component *
            </label>
            <select
              id="rec-part"
              value={recPartId}
              onChange={(e) => setRecPartId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {activeParts.map((part) => (
                <option key={part.id} value={part.id}>
                  {getContextLabel(part.id)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="rec-type"
                className="block text-sm font-medium text-slate-700"
              >
                Service Type *
              </label>
              <select
                id="rec-type"
                value={recType}
                onChange={(e) => setRecType(e.target.value as ServiceType)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              >
                <option value="SERVICE">Service</option>
                <option value="REPAIR">Repair</option>
                <option value="INSPECTION">Inspection</option>
                <option value="REPLACEMENT">Replacement</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label
                htmlFor="rec-date"
                className="block text-sm font-medium text-slate-700"
              >
                Service Date *
              </label>
              <input
                id="rec-date"
                type="date"
                required
                value={recDate}
                onChange={(e) => setRecDate(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="rec-odo"
                className="block text-sm font-medium text-slate-700"
              >
                Odometer (km)
              </label>
              <input
                id="rec-odo"
                type="number"
                min={0}
                value={recOdometer}
                onChange={(e) => setRecOdometer(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="rec-cost"
                className="block text-sm font-medium text-slate-700"
              >
                Cost (₹)
              </label>
              <input
                id="rec-cost"
                type="number"
                min={0}
                value={recCost}
                onChange={(e) => setRecCost(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="rec-desc"
              className="block text-sm font-medium text-slate-700"
            >
              Description *
            </label>
            <textarea
              id="rec-desc"
              rows={3}
              required
              value={recDescription}
              onChange={(e) => setRecDescription(e.target.value)}
              placeholder="Describe the work performed..."
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowRecordModal(false)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Save Record
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
