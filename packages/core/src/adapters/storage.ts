// packages/core/src/adapters/storage.ts
import type {
  Project, Task, TaskFilter, TaskStatus,
  Document, DocumentFilter, DocumentType,
  AgentSession, SessionStatus,
  Decision, DecisionFilter,
  MemoryBank, AgentRole,
} from '../types';

export interface StorageAdapter {
  // Projects
  createProject(project: Project): void;
  getProject(id: string): Project | null;

  // Tasks
  createTask(task: Task): void;
  getTask(id: string): Task | null;
  listTasks(projectId: string, filter: TaskFilter): Task[];
  updateTask(id: string, fields: Partial<Task>): void;
  deleteTask(id: string): void;
  nextTaskId(projectId: string): string;

  // Documents
  createDocument(doc: Omit<Document, 'id'> & { id: string }): void;
  getDocument(id: string): Document | null;
  listDocuments(projectId: string, filter: DocumentFilter): Document[];
  deleteDocument(id: string): void;

  // Agent Sessions
  createSession(session: AgentSession): void;
  getSession(id: string): AgentSession | null;
  listSessions(filter: { task_id?: string; status?: SessionStatus }): AgentSession[];
  updateSession(id: string, fields: Partial<AgentSession>): void;

  // Decisions
  createDecision(decision: Omit<Decision, 'id'>): Decision;
  listDecisions(projectId: string, filter: DecisionFilter): Decision[];

  // Memory Bank
  getMemory(projectId: string): MemoryBank | null;
  upsertMemory(memory: MemoryBank): void;

  // Lifecycle
  close(): void;
}
