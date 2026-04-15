import { useEffect, useState } from 'react';
import { api } from './api';
import { Home } from './pages/Home';
import { Scripts } from './pages/Scripts';
import { Schedules } from './pages/Schedules';
import { History } from './pages/History';
import type { Page } from './types';
import { House, FileCode, CalendarClock, History as HistoryIcon, ArrowUpCircle, Loader2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const pages: { id: Page; label: string; icon: LucideIcon }[] = [
  { id: 'scripts', label: 'Scripts', icon: FileCode },
  { id: 'schedules', label: 'Schedules', icon: CalendarClock },
  { id: 'history', label: 'History', icon: HistoryIcon },
];

const validPages: Page[] = ['dashboard', 'scripts', 'schedules', 'history'];

function getPageFromHash(): Page {
  const hash = window.location.hash.replace('#', '') as Page;
  return validPages.includes(hash) ? hash : 'dashboard';
}

export default function App() {
  const [page, setPage] = useState<Page>(getPageFromHash);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [updateState, setUpdateState] = useState<'idle' | 'confirm' | 'installing' | 'done' | 'error'>('idle');
  const [updateError, setUpdateError] = useState('');

  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    api.checkForUpdate()
      .then(data => {
        if (data.updateAvailable) {
          setUpdateAvailable(true);
          setLatestVersion(data.latestVersion);
        }
      })
      .catch(() => { /* silently ignore */ });
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
    setTimeout(() => window.location.reload(), 3000);
  };

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Home />;
      case 'scripts': return <Scripts />;
      case 'schedules': return <Schedules />;
      case 'history': return <History />;
    }
  };

  return (
    <>

      <div className='flex min-h-screen'>
        <nav className='sticky top-0 h-screen z-20 flex flex-col w-56 bg-[#0a0a0f] border-r border-white/[0.06] shrink-0'>
            <div className='px-4 py-5 border-b border-white/[0.06]'>
              <h1 className="text-white font-semibold text-sm tracking-tight">Monad Code</h1>
              <p className="text-stone-500 text-xs mt-0.5">Authored by: Rasmus Wind</p>
            </div>

            <div className='flex flex-col gap-1 px-3 pt-4'>
              <button
                    key="home"
                    className={`group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer 
                      ${page === 'dashboard'
                        ? 'bg-white/[0.08] text-white'
                        : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.04]'
                      }`}
                    onClick={() => setPage('dashboard')}
                  >
                    <House className='w-4 h-4' />
                    <span className='truncate'>Home</span>
                </button>
            </div>
            
            <div className='px-3 pt-5'>
              <p className='text-stone-500 text-[11px] font-medium uppercase tracking-wider px-3 mb-2'>
                Navigation
              </p>
              <div className='flex flex-col gap-1'>
              {pages.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  className={`group flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-all duration-200 cursor-pointer 
                    ${page === id
                      ? 'bg-white/[0.08] text-white'
                      : 'text-stone-400 hover:text-stone-200 hover:bg-white/[0.04]'
                    }`}
                  onClick={() => setPage(id)}
                >
                  <Icon className='w-4 h-4' />
                  <span className='truncate'>{label}</span>
                </button>
              ))}
              </div>
            </div>

            <div className='mt-auto px-4 py-3 border-t border-white/[0.06]'>
              <div className='flex items-center gap-2'>
                <p className='mr-auto text-stone-600 text-[11px] font-mono'>v1.1.81</p>
                {updateAvailable && updateState === 'idle' && (
                  <button
                    onClick={() => setUpdateState('confirm')}
                    className='cursor-pointer flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20 transition-all duration-200'
                    title={`Update available: v${latestVersion}`}
                  >
                    <ArrowUpCircle className='w-3 h-3' />
                    <span className='text-[10px] font-mono'>v{latestVersion}</span>
                  </button>
                )}
                {updateState === 'installing' && (
                  <span className='flex items-center gap-1 text-[10px] text-stone-500'>
                    <Loader2 className='w-3 h-3 animate-spin' />
                    Updating...
                  </span>
                )}
                {updateState === 'done' && (
                  <span className='text-[10px] text-green-400'>Restarting...</span>
                )}
                {updateState === 'error' && (
                  <button
                    onClick={() => setUpdateState('idle')}
                    className='cursor-pointer text-[10px] text-red-400 hover:text-red-300 transition-colors'
                    title={updateError}
                  >
                    Failed - retry?
                  </button>
                )}
              </div>
              {updateState === 'confirm' && (
                <div className='mt-2 p-2 rounded-lg bg-white/5 border border-white/10'>
                  <p className='text-[11px] text-stone-400 mb-2'>Update to v{latestVersion}?</p>
                  <div className='flex items-center gap-2'>
                    <button
                      onClick={handleUpdate}
                      className='cursor-pointer px-2 py-0.5 rounded-md border border-green-800 text-[10px] text-stone-300 hover:bg-green-600 transition-all duration-200'
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setUpdateState('idle')}
                      className='cursor-pointer px-2 py-0.5 rounded-md border border-white/10 text-[10px] text-stone-500 hover:text-stone-300 hover:bg-white/5 transition-all duration-200'
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
        </nav>
        <main className='flex-1 min-w-0 min-h-0 pb-16 md:pb-0'>
          {renderPage()}
        </main>
      </div>
    </>
  );
}
