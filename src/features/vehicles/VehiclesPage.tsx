import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { PlusIcon, VehicleIcon } from '@/components/Icons';
import { Modal } from '@/components/Modal';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import type {
  MaintenanceRecord,
  OdometerReading,
  Part,
  PartStatus,
  Vehicle,
  VehicleType,
} from '@/types/domain';
import {
  formatCurrency,
  formatDateDisplay,
  formatKm,
  formatVehicleType,
} from '@/utils/formatters';

interface VehiclesPageProps {
  vehicles: Vehicle[];
  parts: Part[];
  odometerReadings: OdometerReading[];
  records: MaintenanceRecord[];
  onAddVehicle: (vehicle: Omit<Vehicle, 'id' | 'userId' | 'isArchived'>) => Promise<void>;
  onUpdateVehicle: (
    vehicleId: string,
    vehicle: Omit<Vehicle, 'id' | 'userId' | 'isArchived'>,
  ) => Promise<void>;
  onAddPart: (part: Omit<Part, 'id' | 'replacedByPartId'>) => Promise<void>;
  onReplacePart: (
    oldPartId: string,
    newPart: Omit<Part, 'id' | 'replacedByPartId'>,
    copySchedules: boolean,
  ) => Promise<void>;
  onAddOdometerReading: (vehicleId: string, readingKm: number, note: string) => Promise<void>;
  onDeleteVehicle: (vehicleId: string) => Promise<void>;
}

export function VehiclesPage({
  vehicles,
  parts,
  odometerReadings,
  records,
  onAddVehicle,
  onUpdateVehicle,
  onAddPart,
  onReplacePart,
  onAddOdometerReading,
  onDeleteVehicle,
}: VehiclesPageProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(
    null,
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [vehiclePendingDeletion, setVehiclePendingDeletion] =
    useState<Vehicle | null>(null);
  const [isDeletingVehicle, setIsDeletingVehicle] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [showAddPartModal, setShowAddPartModal] = useState(false);
  const [showOdometerModal, setShowOdometerModal] = useState(false);
  const [replacingPart, setReplacingPart] = useState<Part | null>(null);

  // Add Vehicle form state
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [vehicleType, setVehicleType] = useState<VehicleType>('FOUR_WHEELER');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');

  const [registrationNumber, setRegistrationNumber] = useState('');
  const [manufactureYear, setManufactureYear] = useState('');

  // Add/Replace Part form state
  const [partName, setPartName] = useState('');
  const [category, setCategory] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [installedOn, setInstalledOn] = useState('');
  const [warrantyExpiryOn, setWarrantyExpiryOn] = useState('');
  const [expectedLifespanMonths, setExpectedLifespanMonths] = useState('');
  const [copySchedules, setCopySchedules] = useState(false);

  // Add Odometer form state
  const [readingKm, setReadingKm] = useState('');
  const [readingNote, setReadingNote] = useState('');

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  function resetPartForm() {
    setPartName('');
    setCategory('');
    setManufacturer('');
    setInstalledOn('');
    setWarrantyExpiryOn('');
    setExpectedLifespanMonths('');
    setCopySchedules(false);
  }

  async function handleVehicleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!brand.trim() || !model.trim()) return;
    setActionError(null);
    try {
      const input = {
        vehicleType,
        brand: brand.trim(),
        model: model.trim(),
        registrationNumber: registrationNumber.trim() || null,
        manufactureYear: manufactureYear ? Number(manufactureYear) : null,
        purchaseDate: null,
        currentOdometerKm: null,
      };
      if (editingVehicle) {
        await onUpdateVehicle(editingVehicle.id, input);
        setSelectedVehicleId(editingVehicle.id);
        setEditingVehicle(null);
      } else {
        await onAddVehicle(input);
      }
      setBrand('');
      setModel('');
      setRegistrationNumber('');
      setManufactureYear('');
      setShowAddVehicleModal(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save vehicle.');
    }
  }

  async function handlePartSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedVehicle || !partName.trim()) return;
    setActionError(null);

    const payload: Omit<Part, 'id' | 'replacedByPartId'> = {
      vehicleId: selectedVehicle.id,
      partName: partName.trim(),
      category: category.trim() || null,
      manufacturer: manufacturer.trim() || null,
      installedOn: installedOn || null,
      purchasedOn: installedOn || null,
      purchaseCost: null,
      warrantyStartOn: null,
      warrantyExpiryOn: warrantyExpiryOn || null,
      expectedLifespanMonths: expectedLifespanMonths
        ? Number(expectedLifespanMonths)
        : null,
      expectedReplacementOn: null,
      status: 'ACTIVE',
      notes: null,
    };

    try {
      if (replacingPart) {
        await onReplacePart(replacingPart.id, payload, copySchedules);
        setReplacingPart(null);
      } else {
        await onAddPart(payload);
        setShowAddPartModal(false);
      }
      resetPartForm();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save component.');
    }
  }

  async function handleOdometerSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const reading = Number(readingKm);
    if (!selectedVehicle || !readingKm || !Number.isFinite(reading) || reading < 0) return;
    setActionError(null);
    try {
      await onAddOdometerReading(
        selectedVehicle.id,
        reading,
        readingNote.trim(),
      );
      setReadingKm('');
      setReadingNote('');
      setShowOdometerModal(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save odometer reading.');
    }
  }

  async function handleDeleteVehicle() {
    if (!vehiclePendingDeletion) return;
    setIsDeletingVehicle(true);
    setActionError(null);
    try {
      await onDeleteVehicle(vehiclePendingDeletion.id);
      setSelectedVehicleId(null);
      setVehiclePendingDeletion(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to delete vehicle.');
    } finally {
      setIsDeletingVehicle(false);
    }
  }

  function mapPartStatusBadge(status: PartStatus) {
    if (status === 'ACTIVE') return <StatusBadge status="Active" />;
    if (status === 'REPLACED') return <StatusBadge status="Replaced" />;
    return <StatusBadge status="Removed" />;
  }

  if (selectedVehicle) {
    const vehicleParts = parts.filter((p) => p.vehicleId === selectedVehicle.id);
    const vehicleReadings = odometerReadings.filter(
      (r) => r.vehicleId === selectedVehicle.id,
    );
    const vehiclePartIds = new Set(vehicleParts.map((p) => p.id));
    const vehicleRecords = records.filter((r) => vehiclePartIds.has(r.partId));

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedVehicleId(null)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            ← Back to Vehicles
          </button>
        </div>

        <PageHeader
          title={`${selectedVehicle.brand} ${selectedVehicle.model}`}
          description={`${formatVehicleType(selectedVehicle.vehicleType)} · ${
            selectedVehicle.registrationNumber ?? 'No registration number'
          } · Latest odometer: ${formatKm(selectedVehicle.currentOdometerKm)}`}
          actions={
            <>
              <button
                type="button"
                onClick={() => {
                  setVehicleType(selectedVehicle.vehicleType);
                  setBrand(selectedVehicle.brand);
                  setModel(selectedVehicle.model);
                  setRegistrationNumber(selectedVehicle.registrationNumber ?? '');
                  setManufactureYear(
                    selectedVehicle.manufactureYear?.toString() ?? '',
                  );
                  setEditingVehicle(selectedVehicle);
                  setActionError(null);
                  setShowAddVehicleModal(true);
                  setSelectedVehicleId(null);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Edit Vehicle
              </button>
              <button
                type="button"
                onClick={() => {
                  setActionError(null);
                  setShowOdometerModal(true);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                Log Odometer
              </button>
              <button
                type="button"
                onClick={() => {
                  resetPartForm();
                  setActionError(null);
                  setShowAddPartModal(true);
                }}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                <PlusIcon className="h-4 w-4" />
                Add Component
              </button>
              <button
                type="button"
                onClick={() => {
                  setVehiclePendingDeletion(selectedVehicle);
                  setActionError(null);
                  setShowDeleteConfirm(true);
                }}
                className="rounded-lg border border-red-600 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
              >
                Delete Vehicle
              </button>
            </>
          }
        />

        {/* Components List */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
            Components ({vehicleParts.length})
          </h2>
          {vehicleParts.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-500">
              No components recorded for this vehicle yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {vehicleParts.map((part) => (
                <li
                  key={part.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {part.partName}
                      </span>
                      {mapPartStatusBadge(part.status)}
                    </div>
                    <p className="mt-1 text-xs text-slate-600">
                      Installed: {formatDateDisplay(part.installedOn)} · Warranty
                      expiry: {formatDateDisplay(part.warrantyExpiryOn)} · Est.
                      replacement: {formatDateDisplay(part.expectedReplacementOn)}
                    </p>
                    {part.manufacturer ? (
                      <p className="text-xs text-slate-500">
                        Manufacturer: {part.manufacturer}
                      </p>
                    ) : null}
                  </div>
                  {part.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      onClick={() => {
                        resetPartForm();
                        setPartName(part.partName);
                        setCategory(part.category ?? '');
                        setReplacingPart(part);
                        setActionError(null);
                      }}
                      className="self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:self-center"
                    >
                      Replace Part
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Odometer History */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
              Odometer Log
            </h2>
            <ul className="divide-y divide-slate-100">
              {vehicleReadings.map((reading) => (
                <li key={reading.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-900">
                      {formatKm(reading.readingKm)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {reading.recordedAt.slice(0, 10)}
                    </span>
                  </div>
                  {reading.note ? (
                    <p className="mt-0.5 text-xs text-slate-600">
                      {reading.note}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>

          {/* Maintenance History */}
          <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="border-b border-slate-100 pb-3 text-base font-semibold text-slate-900">
              Recent Maintenance History
            </h2>
            <ul className="divide-y divide-slate-100">
              {vehicleRecords.map((record) => (
                <li key={record.id} className="py-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-900">
                      {record.serviceType}
                    </span>
                    <span className="text-xs text-slate-500">
                      {record.serviceDate} · {formatCurrency(record.cost)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-600">
                    {record.description}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Add / Replace Component Modal */}
        <Modal
          isOpen={showAddPartModal || replacingPart !== null}
          title={
            replacingPart
              ? `Replace Component: ${replacingPart.partName}`
              : 'Add Component'
          }
          description="All expected lifespans are user-entered estimates. Replacement preserves previous part history."
          onClose={() => {
            setShowAddPartModal(false);
            setReplacingPart(null);
          }}
        >
          <form onSubmit={handlePartSubmit} className="space-y-4">
            {actionError ? (
              <p role="alert" className="text-sm text-red-700">{actionError}</p>
            ) : null}
            <div>
              <label
                htmlFor="part-name"
                className="block text-sm font-medium text-slate-700"
              >
                Component Name *
              </label>
              <input
                id="part-name"
                type="text"
                required
                value={partName}
                onChange={(e) => setPartName(e.target.value)}
                placeholder="e.g. 12V Starter Battery"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="part-category"
                  className="block text-sm font-medium text-slate-700"
                >
                  Category
                </label>
                <input
                  id="part-category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Electrical"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="part-manufacturer"
                  className="block text-sm font-medium text-slate-700"
                >
                  Manufacturer
                </label>
                <input
                  id="part-manufacturer"
                  type="text"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                  placeholder="Optional"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="part-installed-on"
                  className="block text-sm font-medium text-slate-700"
                >
                  Installation Date
                </label>
                <input
                  id="part-installed-on"
                  type="date"
                  value={installedOn}
                  onChange={(e) => setInstalledOn(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label
                  htmlFor="part-lifespan"
                  className="block text-sm font-medium text-slate-700"
                >
                  Expected Lifespan (months)
                </label>
                <input
                  id="part-lifespan"
                  type="number"
                  min={1}
                  value={expectedLifespanMonths}
                  onChange={(e) => setExpectedLifespanMonths(e.target.value)}
                  placeholder="User estimate"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="part-warranty-expiry"
                className="block text-sm font-medium text-slate-700"
              >
                Warranty Expiry Date (optional)
              </label>
              <input
                id="part-warranty-expiry"
                type="date"
                value={warrantyExpiryOn}
                onChange={(e) => setWarrantyExpiryOn(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {replacingPart ? (
              <label className="flex items-start gap-2.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={copySchedules}
                  onChange={(e) => setCopySchedules(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
                />
                <span>
                  Copy maintenance schedules from previous part
                  <span className="block text-xs text-slate-500">
                    Optional — schedules are never copied without your consent.
                  </span>
                </span>
              </label>
            ) : null}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddPartModal(false);
                  setReplacingPart(null);
                }}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                {replacingPart ? 'Save Replacement' : 'Save Component'}
              </button>
            </div>
          </form>
        </Modal>

        {/* Log Odometer Modal */}
        <Modal
          isOpen={showOdometerModal}
          title="Log Odometer Reading"
          description={`Current reading: ${formatKm(selectedVehicle.currentOdometerKm)}`}
          onClose={() => setShowOdometerModal(false)}
        >
          <form onSubmit={handleOdometerSubmit} className="space-y-4">
            {actionError ? (
              <p role="alert" className="text-sm text-red-700">{actionError}</p>
            ) : null}
            <div>
              <label
                htmlFor="odo-km"
                className="block text-sm font-medium text-slate-700"
              >
                Odometer Reading (km) *
              </label>
              <input
                id="odo-km"
                type="number"
                min={0}
                required
                value={readingKm}
                onChange={(e) => setReadingKm(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="odo-note"
                className="block text-sm font-medium text-slate-700"
              >
                Note (optional)
              </label>
              <input
                id="odo-note"
                type="text"
                value={readingNote}
                onChange={(e) => setReadingNote(e.target.value)}
                placeholder="e.g. Monthly check"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowOdometerModal(false)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Save Reading
              </button>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showDeleteConfirm}
          title="Delete Vehicle?"
          description={`Delete ${vehiclePendingDeletion?.brand ?? ''} ${vehiclePendingDeletion?.model ?? ''}? This permanently removes its components, maintenance schedules and records, and odometer history.`}
          onClose={() => {
            if (!isDeletingVehicle) {
              setShowDeleteConfirm(false);
              setVehiclePendingDeletion(null);
              setActionError(null);
            }
          }}
        >
          {actionError ? (
            <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>
          ) : null}
          <div className="flex justify-end gap-2">
            <button
              type="button"
              disabled={isDeletingVehicle}
              onClick={() => {
                setShowDeleteConfirm(false);
                setVehiclePendingDeletion(null);
                setActionError(null);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isDeletingVehicle || !vehiclePendingDeletion}
              onClick={handleDeleteVehicle}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            >
              {isDeletingVehicle ? 'Deleting…' : 'Confirm Delete'}
            </button>
          </div>
        </Modal>

      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Vehicles"
        description="Manage your registered two-wheelers and four-wheelers."
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingVehicle(null);
              setVehicleType('FOUR_WHEELER');
              setBrand('');
              setModel('');
              setRegistrationNumber('');
              setManufactureYear('');
              setActionError(null);
              setShowAddVehicleModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <PlusIcon className="h-4 w-4" />
            Add Vehicle
          </button>
        }
      />

      {vehicles.length === 0 ? (
        <EmptyState
          title="No vehicles registered"
          description="Add your first two-wheeler or four-wheeler to start tracking components, warranties, and maintenance schedules."
          icon={<VehicleIcon className="h-6 w-6" />}
          action={
            <button
              type="button"
              onClick={() => {
                setEditingVehicle(null);
                setActionError(null);
                setShowAddVehicleModal(true);
              }}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Add your first vehicle
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {vehicles.map((vehicle) => {
            const activePartCount = parts.filter(
              (p) => p.vehicleId === vehicle.id && p.status === 'ACTIVE',
            ).length;

            return (
              <div
                key={vehicle.id}
                className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                        {formatVehicleType(vehicle.vehicleType)}
                      </span>
                      <h2 className="mt-2 text-lg font-semibold text-slate-900">
                        {vehicle.brand} {vehicle.model}
                      </h2>
                    </div>
                    <StatusBadge status="Active" />
                  </div>

                  <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <dt className="text-xs text-slate-500">Registration</dt>
                      <dd className="font-medium text-slate-800">
                        {vehicle.registrationNumber ?? 'Not provided'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Latest Odometer</dt>
                      <dd className="font-medium text-slate-800">
                        {formatKm(vehicle.currentOdometerKm)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Active Parts</dt>
                      <dd className="font-medium text-slate-800">
                        {activePartCount}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs text-slate-500">Year</dt>
                      <dd className="font-medium text-slate-800">
                        {vehicle.manufactureYear ?? '—'}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="mt-5 border-t border-slate-100 pt-4">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedVehicleId(vehicle.id)}
                      className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                    >
                      View Vehicle Details
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setVehiclePendingDeletion(vehicle);
                        setActionError(null);
                        setShowDeleteConfirm(true);
                      }}
                      className="rounded-lg border border-red-600 bg-white px-3.5 py-2 text-sm font-medium text-red-600 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={showAddVehicleModal}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
        description={
          editingVehicle
            ? 'Update your registered vehicle details.'
            : 'Register a two-wheeler or four-wheeler in your garage.'
        }
        onClose={() => {
          setShowAddVehicleModal(false);
          setEditingVehicle(null);
          setActionError(null);
        }}
      >
        <form onSubmit={handleVehicleSubmit} className="space-y-4">
          {actionError ? (
            <p role="alert" className="text-sm text-red-700">{actionError}</p>
          ) : null}
          <div>
            <label
              htmlFor="veh-type"
              className="block text-sm font-medium text-slate-700"
            >
              Vehicle Category *
            </label>
            <select
              id="veh-type"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value as VehicleType)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="FOUR_WHEELER">Four-Wheeler</option>
              <option value="TWO_WHEELER">Two-Wheeler</option>
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="veh-brand"
                className="block text-sm font-medium text-slate-700"
              >
                Brand *
              </label>
              <input
                id="veh-brand"
                type="text"
                required
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="e.g. Honda"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="veh-model"
                className="block text-sm font-medium text-slate-700"
              >
                Model *
              </label>
              <input
                id="veh-model"
                type="text"
                required
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. City VX"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="veh-reg"
                className="block text-sm font-medium text-slate-700"
              >
                Registration Number
              </label>
              <input
                id="veh-reg"
                type="text"
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                placeholder="Optional"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label
                htmlFor="veh-year"
                className="block text-sm font-medium text-slate-700"
              >
                Manufacture Year
              </label>
              <input
                id="veh-year"
                type="number"
                min={1950}
                max={2035}
                value={manufactureYear}
                onChange={(e) => setManufactureYear(e.target.value)}
                placeholder="e.g. 2022"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowAddVehicleModal(false);
                setEditingVehicle(null);
                setActionError(null);
              }}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              {editingVehicle ? 'Save Changes' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </Modal>
      <Modal
        isOpen={showDeleteConfirm}
        title="Delete Vehicle?"
        description={
          vehiclePendingDeletion
            ? `Delete ${vehiclePendingDeletion.brand} ${vehiclePendingDeletion.model}? This permanently removes its components, maintenance schedules and records, and odometer history.`
            : 'This permanently removes the vehicle and its associated history.'
        }
        onClose={() => {
          if (!isDeletingVehicle) {
            setShowDeleteConfirm(false);
            setVehiclePendingDeletion(null);
            setActionError(null);
          }
        }}
      >
        {actionError ? (
          <p role="alert" className="mb-4 text-sm text-red-700">{actionError}</p>
        ) : null}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            disabled={isDeletingVehicle}
            onClick={() => {
              setShowDeleteConfirm(false);
              setVehiclePendingDeletion(null);
              setActionError(null);
            }}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeletingVehicle || !vehiclePendingDeletion}
            onClick={handleDeleteVehicle}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeletingVehicle ? 'Deleting…' : 'Confirm Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
