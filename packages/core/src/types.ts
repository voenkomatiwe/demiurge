// packages/core/src/types.ts

// --- Database entities ---

export interface Project {
  id: string;
  name: string;
  path: string;
  created_at: string;
}

export type TaskStatus =
  | 'new'
  | 'blocked'
  | 'in-progress'
  | 'review'
  | 'revision'
  | 'approved'
  | 'done';

export type AgentRole = 'pm' | 'frontend' | 'backend' | 'designer' | 'reviewer';

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  assigned_to: AgentRole | null;
  status: TaskStatus;
  title: string;
  goal: string | null;
  not_doing: string | null;
  design_ref: string | null;
  plan: string | null;
  progress: string | null;
  review: string | null;
  revisions: string | null;
  workspace: string[] | null;
  dependencies: string[] | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export type DocumentType = 'intake' | 'brief' | 'architecture';

export interface Document {
  id: string;
  project_id: string;
  filename: string;
  content: string;
  type: DocumentType;
  created_at: string;
}

export type SessionStatus = 'running' | 'completed' | 'failed';
export type ExecutorType = 'claude-code' | 'codex' | 'github-actions';

export interface AgentSession {
  id: string;
  task_id: string;
  agent: AgentRole;
  executor: ExecutorType;
  status: SessionStatus;
  started_at: string;
  completed_at: string | null;
  pid: number | null;
  log: string | null;
}

export interface Decision {
  id: number;
  project_id: string;
  title: string;
  decision: string;
  reason: string | null;
  tags: string[] | null;
  created_at: string;
}

export interface MemoryBank {
  id: string;
  project_id: string;
  content: string;
  updated_at: string;
}

// --- Config ---

export interface AgentModelConfig {
  model: string;
}

export interface DemiurgeConfig {
  executor: ExecutorType;
  model: string;
  agents: Record<AgentRole, AgentModelConfig>;
}

// --- Executor ---

export interface ExecutionResult {
  sessionId: string;
  status: SessionStatus;
  log: string;
}

// --- Query filters ---

export interface TaskFilter {
  status?: TaskStatus;
  assigned_to?: AgentRole;
  parent_id?: string | null;
}

export interface DocumentFilter {
  type?: DocumentType;
}

export interface DecisionFilter {
  tags?: string[];
}
