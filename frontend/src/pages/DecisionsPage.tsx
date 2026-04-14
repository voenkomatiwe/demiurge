import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Decision } from '@/lib/api';

export function DecisionsPage() {
  const [tagFilter, setTagFilter] = useState('');
  const params = tagFilter ? { tags: tagFilter } : undefined;
  const { data: decisions = [] } = useQuery({
    queryKey: ['decisions', params],
    queryFn: () => api.decisions.list(params),
  });

  const allTags = [...new Set(decisions.flatMap((d: Decision) => d.tags ?? []))];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Decisions</h2>

      {allTags.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setTagFilter('')}
            className={`rounded-md px-3 py-1 text-xs ${!tagFilter ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
          >
            all
          </button>
          {allTags.map((tag: string) => (
            <button
              type="button"
              key={tag}
              onClick={() => setTagFilter(tag)}
              className={`rounded-md px-3 py-1 text-xs ${tagFilter === tag ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {decisions.length === 0 && <p className="text-muted-foreground">No decisions yet.</p>}

      <div className="space-y-3">
        {decisions.map((d: Decision) => (
          <div key={d.id} className="rounded-lg border border-border p-4 space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">#{d.id}</span>
              <h3 className="font-medium text-foreground">{d.title}</h3>
            </div>
            <p className="text-sm text-foreground">{d.decision}</p>
            {d.reason && <p className="text-xs text-muted-foreground">Reason: {d.reason}</p>}
            {d.tags && d.tags.length > 0 && (
              <div className="flex gap-1">
                {d.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-muted px-2 py-0.5 rounded">{tag}</span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
