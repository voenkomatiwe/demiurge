// packages/core/src/services/tasks.ts
import type { StorageAdapter } from '../adapters/storage';
import type { Task, TaskFilter, TaskStatus, AgentRole } from '../types';

interface CreateTaskInput {
  title: string;
  assigned_to?: AgentRole | null;
  goal?: string;
  not_doing?: string;
  design_ref?: string;
  workspace?: string[];
  dependencies?: string[];
}

export class TaskService {
  constructor(
    private adapter: StorageAdapter,
    private projectId: string,
  ) {}

  create(input: CreateTaskInput): Task {
    const id = this.adapter.nextTaskId(this.projectId);
    const task: Task = {
      id,
      project_id: this.projectId,
      parent_id: null,
      assigned_to: input.assigned_to ?? null,
      status: 'new',
      title: input.title,
      goal: input.goal ?? null,
      not_doing: input.not_doing ?? null,
      design_ref: input.design_ref ?? null,
      plan: null,
      progress: null,
      review: null,
      revisions: null,
      workspace: input.workspace ?? null,
      dependencies: input.dependencies ?? null,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
    };
    this.adapter.createTask(task);
    return task;
  }

  createSubtask(parentId: string, input: CreateTaskInput): Task {
    const role = input.assigned_to ?? 'pm';
    const id = `${parentId}-${role}`;
    const task: Task = {
      id,
      project_id: this.projectId,
      parent_id: parentId,
      assigned_to: input.assigned_to ?? null,
      status: 'new',
      title: input.title,
      goal: input.goal ?? null,
      not_doing: input.not_doing ?? null,
      design_ref: input.design_ref ?? null,
      plan: null,
      progress: null,
      review: null,
      revisions: null,
      workspace: input.workspace ?? null,
      dependencies: input.dependencies ?? null,
      created_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
    };
    this.adapter.createTask(task);
    return task;
  }

  get(id: string): Task | null {
    return this.adapter.getTask(id);
  }

  list(filter: TaskFilter = {}): Task[] {
    return this.adapter.listTasks(this.projectId, filter);
  }

  update(id: string, fields: Partial<Task>): void {
    this.adapter.updateTask(id, fields);
  }

  updateStatus(id: string, status: TaskStatus): void {
    const updates: Partial<Task> = { status };
    if (status === 'in-progress' && !this.get(id)?.started_at) {
      updates.started_at = new Date().toISOString();
    }
    if (status === 'done' || status === 'approved') {
      updates.completed_at = new Date().toISOString();
    }
    this.adapter.updateTask(id, updates);
  }

  delete(id: string): void {
    this.adapter.deleteTask(id);
  }
}
