import { cn } from '@/lib/utils';

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-muted text-muted-foreground',
  blocked: 'bg-destructive/10 text-destructive',
  'in-progress': 'bg-info/10 text-info',
  review: 'bg-warning/10 text-warning',
  revision: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  done: 'bg-success/10 text-success',
  running: 'bg-info/10 text-info',
  completed: 'bg-success/10 text-success',
  failed: 'bg-destructive/10 text-destructive',
};

type StatusBadgeProps = { status: string };

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={cn('px-2 py-0.5 rounded-md text-xs font-medium', STATUS_COLORS[status] ?? 'bg-muted')}>
      {status}
    </span>
  );
}
