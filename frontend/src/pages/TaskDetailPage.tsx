import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Task, Session } from '@/lib/api';
import { StatusBadge } from '@/components/StatusBadge';

const STATUSES = ['new', 'blocked', 'in-progress', 'review', 'revision', 'approved', 'done'] as const;

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data: task } = useQuery({ queryKey: ['task', id], queryFn: () => api.tasks.get(id!) });
  const { data: sessions = [] } = useQuery({
    queryKey: ['sessions', id],
    queryFn: () => api.agents.sessions({ task_id: id! }),
  });

  const updateMutation = useMutation({
    mutationFn: (body: { status: string }) => api.tasks.update(id!, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['task', id] }),
  });

  const runMutation = useMutation({
    mutationFn: () => api.agents.run({ agent: task?.assigned_to ?? 'pm', task_id: id! }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions', id] }),
  });

  if (!task) return <div className="text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-foreground">{task.id}</h2>
        <StatusBadge status={task.status} />
        {task.assigned_to && <span className="text-muted-foreground">assigned to {task.assigned_to}</span>}
      </div>

      <h3 className="text-lg text-foreground">{task.title}</h3>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => updateMutation.mutate({ status: s })}
            disabled={task.status === s}
            className={`rounded-md px-3 py-1 text-xs border ${task.status === s ? 'bg-primary text-primary-foreground' : 'border-border text-muted-foreground hover:bg-muted'}`}
          >
            {s}
          </button>
        ))}
        <button
          type="button"
          onClick={() => runMutation.mutate()}
          className="rounded-md px-3 py-1 text-xs bg-success text-primary-foreground ml-auto"
        >
          Run Agent
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {task.goal && (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Goal</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{task.goal}</p>
          </div>
        )}
        {task.not_doing && (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Not Doing</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{task.not_doing}</p>
          </div>
        )}
        {task.plan && (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Plan</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{task.plan}</p>
          </div>
        )}
        {task.progress && (
          <div className="rounded-lg border border-border p-4">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Progress</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{task.progress}</p>
          </div>
        )}
        {task.review && (
          <div className="rounded-lg border border-border p-4 md:col-span-2">
            <h4 className="text-sm font-semibold text-muted-foreground mb-2">Review</h4>
            <p className="text-sm text-foreground whitespace-pre-wrap">{task.review}</p>
          </div>
        )}
      </div>

      {task.workspace && task.workspace.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-1">Workspace</h4>
          <div className="flex gap-2">
            {task.workspace.map((dir: string) => (
              <code key={dir} className="text-xs bg-muted px-2 py-1 rounded">{dir}</code>
            ))}
          </div>
        </div>
      )}

      {sessions.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-2">Agent Sessions</h4>
          <div className="space-y-2">
            {sessions.map((s: Session) => (
              <div key={s.id} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm">
                <StatusBadge status={s.status} />
                <span>{s.agent}</span>
                <span className="text-muted-foreground">{s.executor}</span>
                <span className="text-muted-foreground ml-auto">{new Date(s.started_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
