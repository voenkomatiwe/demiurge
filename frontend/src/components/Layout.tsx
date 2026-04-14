import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { path: '/', label: 'Dashboard' },
  { path: '/tasks', label: 'Tasks' },
  { path: '/documents', label: 'Documents' },
  { path: '/sessions', label: 'Sessions' },
  { path: '/decisions', label: 'Decisions' },
];

export function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border px-6 py-3 flex items-center gap-8">
        <h1 className="text-lg font-bold text-foreground">Demiurge</h1>
        <nav className="flex gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'text-sm px-2 py-1 rounded-md transition-colors',
                location.pathname === item.path
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="p-6 max-w-7xl mx-auto">
        <Outlet />
      </main>
    </div>
  );
}
