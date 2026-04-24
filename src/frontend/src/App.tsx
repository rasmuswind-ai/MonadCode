import { useEffect, useState } from 'react';
import { api } from './api';
import { Home } from './pages/Home';
import { Scripts } from './pages/Scripts';
import { Schedules } from './pages/Schedules';
import { History } from './pages/History';
import type { Page } from './types';
import {
  House,
  FileCode,
  CalendarClock,
  History as HistoryIcon,
  ArrowUpCircle,
  Loader2,
  Sun,
  Moon,
  KeyRound,
  Search,
  Terminal,
  Settings as SettingsIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useTheme } from './useTheme';
import { SecretsPanel } from './components/SecretsPanel';
import { SettingsPanel } from './components/SettingsPanel';
import { LogsPanel } from './components/LogsPanel';
import { CommandPalette } from './components/CommandPalette';

type SidePanel = 'secrets' | 'logs' | 'settings' | null;

const navItems: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: 'dashboard', label: 'Overview', icon: House },
  { id: 'scripts', label: 'Scripts', icon: FileCode },
  { id: 'schedules', label: 'Schedules', icon: CalendarClock },
  { id: 'history', label: 'History', icon: HistoryIcon },
];

const validPages: Page[] = ['dashboard', 'scripts', 'schedules', 'history'];

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '') as Page;
  return validPages.includes(hash) ? hash : 'dashboard';
}

function SideBtn({
  Icon,
  active,
  onClick,
  title,
}: {
  Icon: LucideIcon;
  active?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  const base =
    'relative w-10 h-10 rounded-full grid place-items-center cursor-pointer transition-colors border';
  const tone = active
    ? 'border-ink bg-ink text-on-ink'
    : 'border-line bg-panel text-ink-2 shadow-card-sm hover:bg-panel-soft hover:text-ink';
  return (
    <button type="button" className={`${base} ${tone}`} onClick={onClick} title={title}>
      <Icon className="w-4 h-4" />
    </button>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>(getPageFromHash);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [updateState, setUpdateState] = useState<'idle' | 'confirm' | 'installing' | 'done' | 'error'>('idle');
  const [updateError, setUpdateError] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [sidePanel, setSidePanel] = useState<SidePanel>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const { isDark, toggle } = useTheme();

  const togglePanel = (p: Exclude<SidePanel, null>) =>
    setSidePanel((cur) => (cur === p ? null : p));
  const closePanel = () => setSidePanel(null);

  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Global shortcuts: Ctrl+K / Cmd+K opens the palette; Escape closes it
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      } else if (e.key === 'Escape' && paletteOpen) {
        setPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen]);

  useEffect(() => {
    api
      .checkForUpdate()
      .then((data) => {
        setCurrentVersion(data.currentVersion);
        if (data.updateAvailable) {
          setUpdateAvailable(true);
          setLatestVersion(data.latestVersion);
        }
      })
      .catch(() => {
        /* silently ignore */
      });
  }, []);

  const handleUpdate = async () => {
    setUpdateState('installing');
    setUpdateError('');
    try {
      await api.installUpdate();
    } catch {
      // A network error is expected — the MSI installer restarts the service,
      // killing the backend mid-request.
    }
    setTimeout(() => window.location.reload(), 5000);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard':
        return <Home />;
      case 'scripts':
        return <Scripts />;
      case 'schedules':
        return <Schedules />;
      case 'history':
        return <History />;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-ink flex">
      <aside className="sticky top-0 h-screen shrink-0 z-20 flex flex-col items-center gap-2.5 py-5 w-[72px]">
        <SideBtn
          Icon={Search}
          onClick={() => setPaletteOpen(true)}
          title="Quick run (Ctrl+K)"
        />
        <SideBtn
          Icon={KeyRound}
          active={sidePanel === 'secrets'}
          onClick={() => togglePanel('secrets')}
          title="Secrets"
        />
        <SideBtn
          Icon={Terminal}
          active={sidePanel === 'logs'}
          onClick={() => togglePanel('logs')}
          title="Daemon logs"
        />
        <SideBtn
          Icon={SettingsIcon}
          active={sidePanel === 'settings'}
          onClick={() => togglePanel('settings')}
          title="Settings"
        />
        <div className="flex-1" />
        <SideBtn
          Icon={isDark ? Sun : Moon}
          onClick={toggle}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        />
      </aside>

      <SecretsPanel open={sidePanel === 'secrets'} onClose={closePanel} />
      <LogsPanel open={sidePanel === 'logs'} onClose={closePanel} />
      <SettingsPanel open={sidePanel === 'settings'} onClose={closePanel} />

      <main className="flex-1 min-w-0 flex flex-col gap-[18px] px-7 pt-5 pb-10 min-h-screen">
        <header className="flex items-center gap-6 px-1 py-1">
          <div className="flex items-center gap-2 min-w-[170px]">
            <img src="/favicon.svg" alt="" aria-hidden="true" className="w-6 h-6 shrink-0" />
            <span className="font-bold text-[16px] tracking-tight text-ink">Monad</span>
            <span className="italic font-semibold text-[16px] tracking-tight text-ink">// Code</span>
          </div>

          <nav className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = page === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setPage(item.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[13.5px] font-medium transition-colors cursor-pointer ${
                      active
                        ? 'bg-ink text-on-ink'
                        : 'text-ink-2 hover:bg-panel'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </nav>

          <div className="min-w-[170px] flex items-center justify-end gap-2">
            <span className="text-muted text-[11px] font-mono">
              {currentVersion ? `v${currentVersion}` : ''}
            </span>
            {updateAvailable && updateState === 'idle' && (
              <button
                type="button"
                onClick={() => setUpdateState('confirm')}
                className="cursor-pointer flex items-center gap-1 px-2.5 py-1 rounded-full border border-warn bg-warn-soft text-[11px] font-medium text-ink-2 hover:brightness-95 transition-all"
                title={`Update available: v${latestVersion}`}
              >
                <ArrowUpCircle className="w-3 h-3" />
                <span className="font-mono">v{latestVersion}</span>
              </button>
            )}
            {updateState === 'installing' && (
              <span className="flex items-center gap-1 text-[11px] text-muted">
                <Loader2 className="w-3 h-3 animate-spin" />
                Updating…
              </span>
            )}
            {updateState === 'done' && (
              <span className="text-[11px] text-ok-strong font-medium">Restarting…</span>
            )}
            {updateState === 'error' && (
              <button
                type="button"
                onClick={() => setUpdateState('idle')}
                className="cursor-pointer text-[11px] text-danger-strong hover:brightness-90 transition-colors"
                title={updateError}
              >
                Failed — retry?
              </button>
            )}
          </div>
        </header>

        {updateState === 'confirm' && (
          <div className="bg-panel border border-line rounded-card-sm shadow-card-sm px-4 py-3 flex items-center gap-3">
            <p className="text-[13px] text-ink-2 flex-1">Update to v{latestVersion}?</p>
            <button
              type="button"
              onClick={handleUpdate}
              className="cursor-pointer px-3 py-1.5 rounded-full bg-ink text-on-ink text-[12px] font-medium hover:brightness-110 transition-all"
            >
              Update
            </button>
            <button
              type="button"
              onClick={() => setUpdateState('idle')}
              className="cursor-pointer px-3 py-1.5 rounded-full border border-line text-ink-2 text-[12px] font-medium hover:bg-panel-soft transition-all"
            >
              Cancel
            </button>
          </div>
        )}

        {renderPage()}
      </main>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
