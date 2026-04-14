// packages/core/src/adapters/sqlite.ts
import type { Database } from 'bun:sqlite';
import type { StorageAdapter } from './storage';
import type {
  Project, Task, TaskFilter,
  Document, DocumentFilter,
  AgentSession, SessionStatus,
  Decision, DecisionFilter,
  MemoryBank,
} from '../types';

// JSON columns are stored as TEXT in SQLite, parsed on read.
function parseJson<T>(raw: string | null): T | null {
  if (raw === null) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function toJson(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  return JSON.stringify(value);
}

// Convert raw SQLite row to Task (parse JSON columns).
function rowToTask(row: Record<string, unknown>): Task {
  return {
    ...row,
    workspace: parseJson<string[]>(row.workspace as string | null),
    dependencies: parseJson<string[]>(row.dependencies as string | null),
  } as Task;
}

function rowToDecision(row: Record<string, unknown>): Decision {
  return {
    ...row,
    tags: parseJson<string[]>(row.tags as string | null),
  } as Decision;
}

export class SQLiteAdapter implements StorageAdapter {
  constructor(private db: Database) {}

  // --- Projects ---

  createProject(project: Project): void {
    this.db.run(
      'INSERT INTO projects (id, name, path, created_at) VALUES (?, ?, ?, ?)',
      [project.id, project.name, project.path, project.created_at],
    );
  }

  getProject(id: string): Project | null {
    return this.db.query('SELECT * FROM projects WHERE id = ?').get(id) as Project | null;
  }

  // --- Tasks ---

  createTask(task: Task): void {
    this.db.run(
      `INSERT INTO tasks (id, project_id, parent_id, assigned_to, status, title,
        goal, not_doing, design_ref, plan, progress, review, revisions,
        workspace, dependencies, created_at, started_at, completed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        task.id, task.project_id, task.parent_id, task.assigned_to, task.status,
        task.title, task.goal, task.not_doing, task.design_ref, task.plan,
        task.progress, task.review, task.revisions,
        toJson(task.workspace), toJson(task.dependencies),
        task.created_at, task.started_at, task.completed_at,
      ],
    );
  }

  getTask(id: string): Task | null {
    const row = this.db.query('SELECT * FROM tasks WHERE id = ?').get(id) as Record<string, unknown> | null;
    return row ? rowToTask(row) : null;
  }

  listTasks(projectId: string, filter: TaskFilter): Task[] {
    let sql = 'SELECT * FROM tasks WHERE project_id = ?';
    const params: unknown[] = [projectId];

    if (filter.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter.assigned_to) {
      sql += ' AND assigned_to = ?';
      params.push(filter.assigned_to);
    }
    if (filter.parent_id !== undefined) {
      if (filter.parent_id === null) {
        sql += ' AND parent_id IS NULL';
      } else {
        sql += ' AND parent_id = ?';
        params.push(filter.parent_id);
      }
    }

    sql += ' ORDER BY created_at ASC';
    const rows = this.db.query(sql).all(...params) as Record<string, unknown>[];
    return rows.map(rowToTask);
  }

  updateTask(id: string, fields: Partial<Task>): void {
    const allowed = [
      'status', 'assigned_to', 'title', 'goal', 'not_doing', 'design_ref',
      'plan', 'progress', 'review', 'revisions', 'started_at', 'completed_at',
    ];
    const jsonFields = ['workspace', 'dependencies'];
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        setClauses.push(`${key} = ?`);
        values.push(value);
      } else if (jsonFields.includes(key)) {
        setClauses.push(`${key} = ?`);
        values.push(toJson(value));
      }
    }

    if (setClauses.length === 0) return;
    values.push(id);
    this.db.run(`UPDATE tasks SET ${setClauses.join(', ')} WHERE id = ?`, values);
  }

  deleteTask(id: string): void {
    this.db.run('DELETE FROM tasks WHERE id = ?', [id]);
  }

  nextTaskId(projectId: string): string {
    const row = this.db.query(
      "SELECT id FROM tasks WHERE project_id = ? AND parent_id IS NULL ORDER BY id DESC LIMIT 1"
    ).get(projectId) as { id: string } | null;

    if (!row) return 'TASK-001';
    const num = parseInt(row.id.replace('TASK-', ''), 10);
    return `TASK-${String(num + 1).padStart(3, '0')}`;
  }

  // --- Documents ---

  createDocument(doc: Document): void {
    this.db.run(
      'INSERT INTO documents (id, project_id, filename, content, type, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [doc.id, doc.project_id, doc.filename, doc.content, doc.type, doc.created_at],
    );
  }

  getDocument(id: string): Document | null {
    return this.db.query('SELECT * FROM documents WHERE id = ?').get(id) as Document | null;
  }

  listDocuments(projectId: string, filter: DocumentFilter): Document[] {
    let sql = 'SELECT * FROM documents WHERE project_id = ?';
    const params: unknown[] = [projectId];
    if (filter.type) {
      sql += ' AND type = ?';
      params.push(filter.type);
    }
    sql += ' ORDER BY created_at ASC';
    return this.db.query(sql).all(...params) as Document[];
  }

  deleteDocument(id: string): void {
    this.db.run('DELETE FROM documents WHERE id = ?', [id]);
  }

  // --- Agent Sessions ---

  createSession(session: AgentSession): void {
    this.db.run(
      `INSERT INTO agent_sessions (id, task_id, agent, executor, status, started_at, completed_at, pid, log)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        session.id, session.task_id, session.agent, session.executor,
        session.status, session.started_at, session.completed_at,
        session.pid, session.log,
      ],
    );
  }

  getSession(id: string): AgentSession | null {
    return this.db.query('SELECT * FROM agent_sessions WHERE id = ?').get(id) as AgentSession | null;
  }

  listSessions(filter: { task_id?: string; status?: SessionStatus }): AgentSession[] {
    let sql = 'SELECT * FROM agent_sessions WHERE 1=1';
    const params: unknown[] = [];
    if (filter.task_id) {
      sql += ' AND task_id = ?';
      params.push(filter.task_id);
    }
    if (filter.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    sql += ' ORDER BY started_at DESC';
    return this.db.query(sql).all(...params) as AgentSession[];
  }

  updateSession(id: string, fields: Partial<AgentSession>): void {
    const allowed = ['status', 'completed_at', 'pid', 'log'];
    const setClauses: string[] = [];
    const values: unknown[] = [];

    for (const [key, value] of Object.entries(fields)) {
      if (allowed.includes(key)) {
        setClauses.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (setClauses.length === 0) return;
    values.push(id);
    this.db.run(`UPDATE agent_sessions SET ${setClauses.join(', ')} WHERE id = ?`, values);
  }

  // --- Decisions ---

  createDecision(decision: Omit<Decision, 'id'>): Decision {
    const result = this.db.run(
      'INSERT INTO decisions (project_id, title, decision, reason, tags, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [
        decision.project_id, decision.title, decision.decision,
        decision.reason, toJson(decision.tags), decision.created_at,
      ],
    );
    const id = Number(result.lastInsertRowid);
    return { ...decision, id } as Decision;
  }

  listDecisions(projectId: string, filter: DecisionFilter): Decision[] {
    let sql = 'SELECT * FROM decisions WHERE project_id = ?';
    const params: unknown[] = [projectId];

    sql += ' ORDER BY created_at ASC';
    const rows = this.db.query(sql).all(...params) as Record<string, unknown>[];
    let decisions = rows.map(rowToDecision);

    // Filter by tags in-memory (JSON column — can't use SQL WHERE efficiently)
    if (filter.tags && filter.tags.length > 0) {
      decisions = decisions.filter((d) =>
        d.tags && filter.tags!.some((tag) => d.tags!.includes(tag)),
      );
    }

    return decisions;
  }

  // --- Memory Bank ---

  getMemory(projectId: string): MemoryBank | null {
    return this.db.query('SELECT * FROM memory_bank WHERE project_id = ?').get(projectId) as MemoryBank | null;
  }

  upsertMemory(memory: MemoryBank): void {
    this.db.run(
      `INSERT INTO memory_bank (id, project_id, content, updated_at)
       VALUES (?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET content = excluded.content, updated_at = excluded.updated_at`,
      [memory.id, memory.project_id, memory.content, memory.updated_at],
    );
  }

  // --- Lifecycle ---

  close(): void {
    this.db.close();
  }
}
