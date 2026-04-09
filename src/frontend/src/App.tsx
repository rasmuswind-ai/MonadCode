import { useEffect, useState } from 'react';
import { Home } from './pages/Home';
import { Scripts } from './pages/Scripts';
import { Schedules } from './pages/Schedules';
import { History } from './pages/History';
import type { Page } from './types';
import { House, FileCode, CalendarClock, History as HistoryIcon } from 'lucide-react';
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

  useEffect(() => {
    window.location.hash = page;
  }, [page]);

  useEffect(() => {
    const onHashChange = () => setPage(getPageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

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
              <p className='text-stone-600 text-[11px] font-mono'>v1.1.2</p>
            </div>
        </nav>
        <main className='flex-1 min-w-0 min-h-0 pb-16 md:pb-0'>
          {renderPage()}
        </main>
      </div>
    </>
  );
}
