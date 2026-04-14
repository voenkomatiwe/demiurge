import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { TaskTree } from '@/components/TaskTree';

const STATUSES = ['', 'new', 'blocked', 'in-progress', 'review', 'revision', 'approved', 'done'];

export function TasksPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const params = statusFilter ? { status: statusFilter } : undefined;
  const { data: tasks = [] } = useQuery({ queryKey: ['tasks', params], queryFn: () => api.tasks.list(params) });

  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  const createMutation = useMutation({
    mutationFn: (body: { title: string; assigned_to?: string }) => api.tasks.create(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setShowCreate(false);
      setTitle('');
      setAssignedTo('');
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">Tasks</h2>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-md bg-primary px-4 py-2 text-sm text-primary-foreground"
        >
          Create Task
        </button>
      </div>

      <div className="flex gap-2">
        {STATUSES.map((s) => (
          <button
            type="button"
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`rounded-md px-3 py-1 text-xs ${statusFilter === s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            {s || 'all'}
          </button>
        ))}
      </div>

      <TaskTree tasks={tasks} />

      {showCreate && (
        <div className="fixed inset-0 bg-foreground/20 flex items-center justify-center">
          <div className="bg-card rounded-lg border border-border p-6 w-96 space-y-4">
            <h3 className="text-lg font-semibold">New Task</h3>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            />
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-full rounded-md border border-border px-3 py-2 text-sm"
            >
              <option value="">Unassigned</option>
              <option value="pm">PM</option>
              <option value="frontend">Frontend</option>
              <option value="backend">Backend</option>
              <option value="designer">Designer</option>
              <option value="reviewer">Reviewer</option>
            </select>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm rounded-md border border-border"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => createMutation.mutate({ title, assigned_to: assignedTo || undefined })}
                className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
