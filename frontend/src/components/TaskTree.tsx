import { Link } from 'react-router-dom';
import { StatusBadge } from '@/components/StatusBadge';
import type { Task } from '@/lib/api';

type TaskTreeProps = { tasks: Task[] };

export function TaskTree({ tasks }: TaskTreeProps) {
  const parents = tasks.filter((t) => !t.parent_id);
  const children = (parentId: string) => tasks.filter((t) => t.parent_id === parentId);

  return (
    <div className="space-y-2">
      {parents.map((parent) => (
        <div key={parent.id} className="rounded-lg border border-border">
          <Link to={`/tasks/${parent.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50">
            <StatusBadge status={parent.status} />
            <span className="font-medium text-foreground">{parent.id}</span>
            <span className="text-muted-foreground">{parent.title}</span>
            {parent.assigned_to && (
              <span className="ml-auto text-xs text-muted-foreground">{parent.assigned_to}</span>
            )}
          </Link>
          {children(parent.id).length > 0 && (
            <div className="border-t border-border pl-6">
              {children(parent.id).map((child) => (
                <Link
                  key={child.id}
                  to={`/tasks/${child.id}`}
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 text-sm"
                >
                  <StatusBadge status={child.status} />
                  <span className="font-medium">{child.id}</span>
                  <span className="text-muted-foreground">{child.title}</span>
                  {child.assigned_to && (
                    <span className="ml-auto text-xs text-muted-foreground">{child.assigned_to}</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
