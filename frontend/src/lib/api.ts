const BASE = '/api/v1';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return undefined as T;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export interface Task {
  id: string;
  title: string;
  status: string;
  assigned_to: string | null;
  parent_id: string | null;
  goal: string | null;
  not_doing: string | null;
  plan: string | null;
  progress: string | null;
  review: string | null;
  workspace: string[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  agent: string;
  task_id: string;
  executor: string;
  status: string;
  pid: number | null;
  log: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface Document {
  id: string;
  filename: string;
  content: string;
  type: string;
  created_at: string;
}

export interface Decision {
  id: string;
  title: string;
  decision: string;
  reason: string | null;
  tags: string[];
  created_at: string;
}

export const api = {
  tasks: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<Task[]>(`/tasks${qs}`);
    },
    get: (id: string) => request<Task>(`/tasks/${id}`),
    create: (body: { title: string; assigned_to?: string; parent_id?: string }) =>
      request<Task>('/tasks', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: Partial<Pick<Task, 'title' | 'status' | 'assigned_to' | 'goal' | 'not_doing' | 'plan' | 'progress' | 'review'>>) =>
      request<Task>(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/tasks/${id}`, { method: 'DELETE' }),
  },
  documents: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<Document[]>(`/documents${qs}`);
    },
    get: (id: string) => request<Document>(`/documents/${id}`),
    create: (body: { filename: string; content: string; type: string }) =>
      request<Document>('/documents', { method: 'POST', body: JSON.stringify(body) }),
    delete: (id: string) => request<void>(`/documents/${id}`, { method: 'DELETE' }),
  },
  agents: {
    sessions: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<Session[]>(`/agents/sessions${qs}`);
    },
    run: (body: { agent: string; task_id: string }) =>
      request<Session>('/agents/run', { method: 'POST', body: JSON.stringify(body) }),
    stop: (sessionId: string) =>
      request<Session>('/agents/stop', { method: 'POST', body: JSON.stringify({ session_id: sessionId }) }),
  },
  decisions: {
    list: (params?: Record<string, string>) => {
      const qs = params ? `?${new URLSearchParams(params).toString()}` : '';
      return request<Decision[]>(`/decisions${qs}`);
    },
    create: (body: { title: string; decision: string; reason?: string; tags?: string[] }) =>
      request<Decision>('/decisions', { method: 'POST', body: JSON.stringify(body) }),
  },
  memory: {
    get: () => request<{ content: string }>('/memory'),
    set: (content: string) =>
      request<{ content: string }>('/memory', { method: 'PUT', body: JSON.stringify({ content }) }),
  },
};
