import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api } from '@/lib/api';
import type { Task, Session } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

export function DashboardPage() {
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks'], queryFn: () => api.tasks.list() });
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: () => api.agents.sessions() });

  const statusCounts = tasks.reduce<Record<string, number>>((acc, t: Task) => {
    acc[t.status] = (acc[t.status] || 0) + 1;
    return acc;
  }, {});

  const activeSessions = sessions.filter((s: Session) => s.status === 'running');

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-foreground">Dashboard</h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {Object.entries(statusCounts).map(([status, count]) => (
          <div key={status} className="rounded-lg border border-border bg-card p-4">
            <p className="text-sm text-muted-foreground">{status}</p>
            <p className="text-2xl font-bold text-card-foreground">{count}</p>
          </div>
        ))}
      </div>

      {activeSessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-2">Active Agents</h3>
          <div className="space-y-2">
            {activeSessions.map((s: Session) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <StatusBadge status={s.status} />
                <span className="font-medium">{s.agent}</span>
                <span className="text-muted-foreground text-sm">on {s.task_id}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/documents" className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground">
          Upload Docs
        </Link>
        <Link to="/tasks" className="rounded-md border border-border px-4 py-2 text-sm text-foreground">
          View Tasks
        </Link>
      </div>
    </div>
  );
}
