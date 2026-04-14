import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Session } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

export function SessionsPage() {
  const queryClient = useQueryClient();
  const { data: sessions = [] } = useQuery({ queryKey: ['sessions'], queryFn: () => api.agents.sessions() });

  const stopMutation = useMutation({
    mutationFn: (id: string) => api.agents.stop(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Agent Sessions</h2>

      {sessions.length === 0 && <p className="text-muted-foreground">No sessions yet.</p>}

      <div className="space-y-2">
        {sessions.map((s: Session) => (
          <div key={s.id} className="rounded-lg border border-border p-4 space-y-2">
            <div className="flex items-center gap-3">
              <StatusBadge status={s.status} />
              <span className="font-medium text-foreground">{s.agent}</span>
              <span className="text-muted-foreground text-sm">on {s.task_id}</span>
              <span className="text-muted-foreground text-xs ml-auto">{s.executor}</span>
              {s.status === 'running' && (
                <button
                  type="button"
                  onClick={() => stopMutation.mutate(s.id)}
                  className="text-xs rounded-md border border-destructive text-destructive px-2 py-1"
                >
                  Stop
                </button>
              )}
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span>Started: {new Date(s.started_at).toLocaleString()}</span>
              {s.completed_at && <span>Completed: {new Date(s.completed_at).toLocaleString()}</span>}
              {s.pid && <span>PID: {s.pid}</span>}
            </div>
            {s.log && (
              <pre className="text-xs bg-muted p-3 rounded-md max-h-48 overflow-auto whitespace-pre-wrap">
                {s.log}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
