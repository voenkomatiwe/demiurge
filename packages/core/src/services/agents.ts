// packages/core/src/services/agents.ts
import { randomUUID } from 'node:crypto';
import type { StorageAdapter } from '../adapters/storage';
import type { AgentSession, AgentRole, ExecutorType, SessionStatus } from '../types';

export class AgentService {
  constructor(private adapter: StorageAdapter) {}

  createSession(taskId: string, agent: AgentRole, executor: ExecutorType, pid?: number): AgentSession {
    const session: AgentSession = {
      id: randomUUID(),
      task_id: taskId,
      agent,
      executor,
      status: 'running',
      started_at: new Date().toISOString(),
      completed_at: null,
      pid: pid ?? null,
      log: null,
    };
    this.adapter.createSession(session);
    return session;
  }

  complete(sessionId: string, status: SessionStatus, log?: string): void {
    this.adapter.updateSession(sessionId, {
      status,
      completed_at: new Date().toISOString(),
      log: log ?? null,
    });
  }

  getSession(id: string): AgentSession | null {
    return this.adapter.getSession(id);
  }

  listSessions(filter: { task_id?: string; status?: SessionStatus } = {}): AgentSession[] {
    return this.adapter.listSessions(filter);
  }

  updatePid(sessionId: string, pid: number): void {
    this.adapter.updateSession(sessionId, { pid });
  }
}
