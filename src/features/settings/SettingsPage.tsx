import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import type { Profile, ReminderSettings } from '@/types/domain';

interface SettingsPageProps {
  profile: Profile;
  settings: ReminderSettings | null;
  onSaveProfile: (updated: Profile) => void;
  onSaveSettings: (updated: ReminderSettings) => void;
}

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'Europe/London',
  'Asia/Singapore',
];

export function SettingsPage({
  profile,
  settings,
  onSaveProfile,
  onSaveSettings,
}: SettingsPageProps) {
  const [fullName, setFullName] = useState(profile.fullName);
  const [timezone, setTimezone] = useState(profile.timezone);
  const [inAppEnabled, setInAppEnabled] = useState(settings?.inAppEnabled ?? false);
  const [emailEnabled, setEmailEnabled] = useState(settings?.emailEnabled ?? false);
  const [daysInput, setDaysInput] = useState(
    settings?.reminderDaysBefore.join(', ') ?? '',
  );
  const [kmBefore, setKmBefore] = useState(String(settings?.reminderKmBefore ?? 0));
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsedDays = daysInput
      .split(',')
      .map((val) => Number(val.trim()))
      .filter((num) => !Number.isNaN(num) && num >= 0);

    onSaveProfile({
      ...profile,
      fullName: fullName.trim() || profile.fullName,
      timezone,
    });

    onSaveSettings({
      userId: profile.id,
      inAppEnabled,
      emailEnabled,
      reminderDaysBefore: parsedDays.length > 0 ? parsedDays : [30, 7, 0],
      reminderKmBefore: Math.max(1, Number(kmBefore) || 500),
    });

    setSavedMessage('Settings updated in local prototype state.');
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your timezone, notification channels, and reminder offsets."
      />

      <form
        onSubmit={handleSubmit}
        className="max-w-2xl space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
      >
        {/* Profile */}
        <section className="space-y-4">
          <h2 className="border-b border-slate-100 pb-2 text-base font-semibold text-slate-900">
            Profile &amp; Timezone
          </h2>
          <div>
            <label
              htmlFor="settings-name"
              className="block text-sm font-medium text-slate-700"
            >
              Full Name
            </label>
            <input
              id="settings-name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="settings-tz"
              className="block text-sm font-medium text-slate-700"
            >
              Timezone
            </label>
            <select
              id="settings-tz"
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {TIMEZONE_OPTIONS.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
        </section>

        {/* Reminder Channels */}
        <section className="space-y-3">
          <h2 className="border-b border-slate-100 pb-2 text-base font-semibold text-slate-900">
            Reminder Preferences
          </h2>

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={inAppEnabled}
              onChange={(e) => setInAppEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span>
              In-app notifications (Primary channel)
              <span className="block text-xs text-slate-500">
                Always available inside the Notification Center.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={emailEnabled}
              onChange={(e) => setEmailEnabled(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
            />
            <span>
              Email notifications (Optional — Phase 7)
              <span className="block text-xs text-slate-500">
                Email delivery is optional and will be connected after in-app reminders are verified.
              </span>
            </span>
          </label>
        </section>

        {/* Offsets */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="settings-days"
              className="block text-sm font-medium text-slate-700"
            >
              Date Reminder Offsets (days before)
            </label>
            <input
              id="settings-days"
              type="text"
              value={daysInput}
              onChange={(e) => setDaysInput(e.target.value)}
              placeholder="30, 7, 0"
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="settings-km"
              className="block text-sm font-medium text-slate-700"
            >
              Distance Reminder Threshold (km)
            </label>
            <input
              id="settings-km"
              type="number"
              min={1}
              value={kmBefore}
              onChange={(e) => setKmBefore(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </section>

        {savedMessage ? (
          <p
            role="status"
            className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-800"
          >
            {savedMessage}
          </p>
        ) : null}

        <div className="flex justify-end">
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Save Preferences
          </button>
        </div>
      </form>
    </div>
  );
}
