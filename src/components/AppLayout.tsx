import { useState, type ReactNode } from 'react';
import {
  BellIcon,
  CloseIcon,
  DashboardIcon,
  MenuIcon,
  SettingsIcon,
  VehicleIcon,
  WrenchIcon,
} from '@/components/Icons';
import type { NavSection, Profile } from '@/types/domain';

interface AppLayoutProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  onSignOut: () => void;
  isSigningOut?: boolean;
  unreadCount: number;
  profile: Profile;
  children: ReactNode;
}

interface NavItem {
  id: NavSection;
  label: string;
  icon: (props: { className?: string }) => ReactNode;
  badge?: number;
}

export function AppLayout({
  activeSection,
  onNavigate,
  onSignOut,
  isSigningOut = false,
  unreadCount,
  profile,
  children,
}: AppLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
    { id: 'vehicles', label: 'My Vehicles', icon: VehicleIcon },
    { id: 'maintenance', label: 'Maintenance', icon: WrenchIcon },
    {
      id: 'notifications',
      label: 'Notifications',
      icon: BellIcon,
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  function handleSelect(section: NavSection) {
    onNavigate(section);
    setMobileMenuOpen(false);
  }

  function renderNavLinks() {
    return (
      <nav aria-label="Primary navigation" className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive = activeSection === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <span className="flex items-center gap-3">
                <Icon
                  className={`h-5 w-5 ${
                    isActive ? 'text-blue-600' : 'text-slate-500'
                  }`}
                />
                <span>{item.label}</span>
              </span>
              {item.badge !== undefined ? (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-xs font-semibold text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:shrink-0 lg:flex-col lg:border-r lg:border-slate-200 lg:bg-white">
        <div className="flex h-16 items-center gap-2.5 border-b border-slate-200 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            VC
          </div>
          <div>
            <span className="block text-base font-bold tracking-tight text-slate-900">
              VehicleCare
            </span>
            <span className="block text-[11px] font-medium text-slate-500">
              Parts &amp; Maintenance
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">{renderNavLinks()}</div>

        <div className="border-t border-slate-200 p-4 space-y-2.5">
          <div className="rounded-lg bg-slate-50 p-3">
            <p className="truncate text-sm font-semibold text-slate-900">
              {profile.fullName}
            </p>
            <p className="truncate text-xs text-slate-500">{profile.email}</p>
            <p className="mt-1 text-[11px] text-slate-500">
              TZ: {profile.timezone}
            </p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            disabled={isSigningOut}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {isSigningOut ? 'Signing out...' : 'Sign Out'}
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4 lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
            VC
          </div>
          <span className="text-base font-bold text-slate-900">
            VehicleCare
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelect('notifications')}
            aria-label={`Notifications (${unreadCount} unread)`}
            className="relative rounded-lg p-2 text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <BellIcon className="h-5 w-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {mobileMenuOpen ? (
              <CloseIcon className="h-5 w-5" />
            ) : (
              <MenuIcon className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen ? (
        <div className="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
          {renderNavLinks()}
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-600">
            <span>
              Signed in as <span className="font-semibold">{profile.fullName}</span>
            </span>
            <button
              type="button"
              onClick={onSignOut}
              disabled={isSigningOut}
              className="rounded border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              {isSigningOut ? 'Signing out...' : 'Sign Out'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Main Content */}
      <main className="flex-1 overflow-x-hidden">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
