// packages/core/__tests__/sqlite-adapter.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createClient } from '../src/db/client';
import { initSchema } from '../src/db/schema';
import { SQLiteAdapter } from '../src/adapters/sqlite';
import type { Task, Document, Decision, AgentSession } from '../src/types';
import { unlinkSync } from 'node:fs';

const TEST_DB = '/tmp/demiurge-adapter-test.db';

describe('SQLiteAdapter', () => {
  let adapter: SQLiteAdapter;

  beforeEach(() => {
    const db = createClient(TEST_DB);
    initSchema(db);
    adapter = new SQLiteAdapter(db);
    adapter.createProject({ id: 'proj-1', name: 'Test', path: '/tmp/test', created_at: new Date().toISOString() });
  });

  afterEach(() => {
    adapter.close();
    try { unlinkSync(TEST_DB); } catch {}
  });

  test('creates and retrieves a task', () => {
    adapter.createTask({
      id: 'TASK-001', project_id: 'proj-1', parent_id: null,
      assigned_to: 'pm', status: 'new', title: 'Setup project',
      goal: 'Initialize the project', not_doing: null, design_ref: null,
      plan: null, progress: null, review: null, revisions: null,
      workspace: ['backend/src/'], dependencies: null,
      created_at: new Date().toISOString(), started_at: null, completed_at: null,
    });
    const task = adapter.getTask('TASK-001');
    expect(task).not.toBeNull();
    expect(task!.title).toBe('Setup project');
    expect(task!.workspace).toEqual(['backend/src/']);
  });

  test('lists tasks with filters', () => {
    adapter.createTask({
      id: 'TASK-001', project_id: 'proj-1', parent_id: null,
      assigned_to: 'pm', status: 'new', title: 'Task 1',
      goal: null, not_doing: null, design_ref: null, plan: null,
      progress: null, review: null, revisions: null,
      workspace: null, dependencies: null,
      created_at: new Date().toISOString(), started_at: null, completed_at: null,
    });
    adapter.createTask({
      id: 'TASK-002', project_id: 'proj-1', parent_id: null,
      assigned_to: 'frontend', status: 'in-progress', title: 'Task 2',
      goal: null, not_doing: null, design_ref: null, plan: null,
      progress: null, review: null, revisions: null,
      workspace: null, dependencies: null,
      created_at: new Date().toISOString(), started_at: null, completed_at: null,
    });

    const all = adapter.listTasks('proj-1', {});
    expect(all).toHaveLength(2);

    const filtered = adapter.listTasks('proj-1', { status: 'new' });
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('TASK-001');

    const byAgent = adapter.listTasks('proj-1', { assigned_to: 'frontend' });
    expect(byAgent).toHaveLength(1);
    expect(byAgent[0].id).toBe('TASK-002');
  });

  test('updates task fields', () => {
    adapter.createTask({
      id: 'TASK-001', project_id: 'proj-1', parent_id: null,
      assigned_to: 'pm', status: 'new', title: 'Task 1',
      goal: null, not_doing: null, design_ref: null, plan: null,
      progress: null, review: null, revisions: null,
      workspace: null, dependencies: null,
      created_at: new Date().toISOString(), started_at: null, completed_at: null,
    });
    adapter.updateTask('TASK-001', { status: 'in-progress', plan: 'Step 1: do X' });
    const task = adapter.getTask('TASK-001');
    expect(task!.status).toBe('in-progress');
    expect(task!.plan).toBe('Step 1: do X');
  });

  test('deletes a task', () => {
    adapter.createTask({
      id: 'TASK-001', project_id: 'proj-1', parent_id: null,
      assigned_to: 'pm', status: 'new', title: 'Task 1',
      goal: null, not_doing: null, design_ref: null, plan: null,
      progress: null, review: null, revisions: null,
      workspace: null, dependencies: null,
      created_at: new Date().toISOString(), started_at: null, completed_at: null,
    });
    adapter.deleteTask('TASK-001');
    expect(adapter.getTask('TASK-001')).toBeNull();
  });

  test('creates and lists documents', () => {
    adapter.createDocument({
      id: 'doc-1', project_id: 'proj-1', filename: 'spec.md',
      content: '# Spec', type: 'intake', created_at: new Date().toISOString(),
    });
    const docs = adapter.listDocuments('proj-1', {});
    expect(docs).toHaveLength(1);
    expect(docs[0].filename).toBe('spec.md');
  });

  test('creates and lists decisions with tag filter', () => {
    adapter.createDecision({
      project_id: 'proj-1', title: 'Use React', decision: 'React for UI',
      reason: 'Team knows it', tags: ['frontend', 'stack'],
      created_at: new Date().toISOString(),
    });
    adapter.createDecision({
      project_id: 'proj-1', title: 'Use Fastify', decision: 'Fastify for API',
      reason: 'Fast', tags: ['backend', 'stack'],
      created_at: new Date().toISOString(),
    });

    const all = adapter.listDecisions('proj-1', {});
    expect(all).toHaveLength(2);

    const frontend = adapter.listDecisions('proj-1', { tags: ['frontend'] });
    expect(frontend).toHaveLength(1);
    expect(frontend[0].title).toBe('Use React');
  });

  test('upserts and retrieves memory', () => {
    adapter.upsertMemory({
      id: 'mem-1', project_id: 'proj-1',
      content: 'Active task: TASK-001', updated_at: new Date().toISOString(),
    });
    const mem = adapter.getMemory('proj-1');
    expect(mem).not.toBeNull();
    expect(mem!.content).toBe('Active task: TASK-001');

    adapter.upsertMemory({
      id: 'mem-1', project_id: 'proj-1',
      content: 'Updated state', updated_at: new Date().toISOString(),
    });
    const updated = adapter.getMemory('proj-1');
    expect(updated!.content).toBe('Updated state');
  });

  test('creates and lists sessions', () => {
    adapter.createTask({
      id: 'TASK-001', project_id: 'proj-1', parent_id: null,
      assigned_to: 'pm', status: 'new', title: 'Task 1',
      goal: null, not_doing: null, design_ref: null, plan: null,
      progress: null, review: null, revisions: null,
      workspace: null, dependencies: null,
      created_at: new Date().toISOString(), started_at: null, completed_at: null,
    });
    adapter.createSession({
      id: 'sess-1', task_id: 'TASK-001', agent: 'pm',
      executor: 'claude-code', status: 'running',
      started_at: new Date().toISOString(),
      completed_at: null, pid: 12345, log: null,
    });
    const sessions = adapter.listSessions({});
    expect(sessions).toHaveLength(1);
    expect(sessions[0].pid).toBe(12345);
  });

  test('generates sequential task IDs', () => {
    expect(adapter.nextTaskId('proj-1')).toBe('TASK-001');

    adapter.createTask({
      id: 'TASK-001', project_id: 'proj-1', parent_id: null,
      assigned_to: null, status: 'new', title: 'T1',
      goal: null, not_doing: null, design_ref: null, plan: null,
      progress: null, review: null, revisions: null,
      workspace: null, dependencies: null,
      created_at: new Date().toISOString(), started_at: null, completed_at: null,
    });
    expect(adapter.nextTaskId('proj-1')).toBe('TASK-002');
  });
});
