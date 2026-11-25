import { useState } from 'react';
import { EmptyState } from '@/components/EmptyState';
import { BellIcon } from '@/components/Icons';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import type { AppNotification } from '@/types/domain';
import { formatDateDisplay, formatKm } from '@/utils/formatters';

interface NotificationsPageProps {
  notifications: AppNotification[];
  onToggleRead: (notificationId: string) => void;
  onMarkAllRead: () => void;
}

export function NotificationsPage({
  notifications,
  onToggleRead,
  onMarkAllRead,
}: NotificationsPageProps) {
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const filtered = notifications.filter((n) => {
    if (filter === 'unread') return !n.isRead;
    if (filter === 'read') return n.isRead;
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="In-app reminders for upcoming maintenance, warranty expiry, and estimated replacements."
        actions={
          unreadCount > 0 ? (
            <button
              type="button"
              onClick={onMarkAllRead}
              className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Mark all as read
            </button>
          ) : null
        }
      />

      <div className="flex gap-2" role="group" aria-label="Filter notifications">
        {(['all', 'unread', 'read'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setFilter(tab)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize transition-colors ${
              filter === tab
                ? 'bg-blue-600 text-white'
                : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No notifications to show"
          description="You are all caught up for the selected filter."
          icon={<BellIcon className="h-6 w-6" />}
        />
      ) : (
        <ul className="space-y-3">
          {filtered.map((notif) => (
            <li
              key={notif.id}
              className={`rounded-xl border p-5 shadow-xs transition-colors ${
                notif.isRead
                  ? 'border-slate-200 bg-white'
                  : 'border-blue-200 bg-blue-50/30'
              }`}
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {notif.notificationType}
                    </span>
                    <StatusBadge
                      status={
                        notif.reminderOffsetValue === 0
                          ? 'Overdue'
                          : 'Due soon'
                      }
                    />
                    {!notif.isRead ? (
                      <span className="text-xs font-semibold text-blue-700">
                        ● Unread
                      </span>
                    ) : null}
                  </div>
                  <h2 className="text-base font-semibold text-slate-900">
                    {notif.title}
                  </h2>
                  <p className="text-sm text-slate-600">{notif.message}</p>
                  <p className="text-xs text-slate-500">
                    {notif.dueDate
                      ? `Due date: ${formatDateDisplay(notif.dueDate)}`
                      : `Due odometer: ${formatKm(notif.dueOdometerKm)}`}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onToggleRead(notif.id)}
                  className="self-start rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                >
                  {notif.isRead ? 'Mark unread' : 'Mark read'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
