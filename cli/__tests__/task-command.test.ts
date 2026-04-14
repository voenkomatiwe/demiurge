// cli/__tests__/task-command.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import {
  createClient,
  initSchema,
  SQLiteAdapter,
  TaskService,
} from '@demiurge/core';
import { mkdirSync, rmSync } from 'node:fs';

const TEST_DIR = '/tmp/demiurge-cli-test';
const TEST_DB = `${TEST_DIR}/.demiurge/data.db`;

describe('Task CLI logic', () => {
  let adapter: SQLiteAdapter;
  let tasks: TaskService;

  beforeEach(() => {
    mkdirSync(`${TEST_DIR}/.demiurge`, { recursive: true });
    const db = createClient(TEST_DB);
    initSchema(db);
    adapter = new SQLiteAdapter(db);
    adapter.createProject({
      id: 'proj-1',
      name: 'Test',
      path: TEST_DIR,
      created_at: new Date().toISOString(),
    });
    tasks = new TaskService(adapter, 'proj-1');
  });

  afterEach(() => {
    adapter.close();
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test('list returns empty array for new project', () => {
    expect(tasks.list()).toEqual([]);
  });

  test('create + get round-trip', () => {
    const created = tasks.create({
      title: 'Build API',
      assigned_to: 'backend',
    });
    const retrieved = tasks.get(created.id);
    expect(retrieved!.title).toBe('Build API');
    expect(retrieved!.assigned_to).toBe('backend');
  });

  test('update --status changes status', () => {
    tasks.create({ title: 'Test', assigned_to: 'pm' });
    tasks.updateStatus('TASK-001', 'in-progress');
    expect(tasks.get('TASK-001')!.status).toBe('in-progress');
  });

  test('update --plan sets plan field', () => {
    tasks.create({ title: 'Test', assigned_to: 'frontend' });
    tasks.update('TASK-001', { plan: 'Step 1: scaffold\nStep 2: implement' });
    expect(tasks.get('TASK-001')!.plan).toContain('Step 1');
  });

  test('delete removes task', () => {
    tasks.create({ title: 'Temporary', assigned_to: 'pm' });
    expect(tasks.get('TASK-001')).not.toBeNull();
    tasks.delete('TASK-001');
    expect(tasks.get('TASK-001')).toBeNull();
  });

  test('createSubtask sets parent_id', () => {
    const parent = tasks.create({ title: 'Parent task', assigned_to: 'pm' });
    const child = tasks.createSubtask(parent.id, {
      title: 'Child task',
      assigned_to: 'frontend',
    });
    expect(child.parent_id).toBe(parent.id);
    expect(child.id).toContain(parent.id);
  });

  test('list with status filter', () => {
    tasks.create({ title: 'Task A', assigned_to: 'pm' });
    tasks.create({ title: 'Task B', assigned_to: 'frontend' });
    tasks.updateStatus('TASK-001', 'in-progress');
    const inProgress = tasks.list({ status: 'in-progress' });
    expect(inProgress.length).toBe(1);
    expect(inProgress[0].title).toBe('Task A');
  });

  test('update sets started_at when moving to in-progress', () => {
    tasks.create({ title: 'Test', assigned_to: 'pm' });
    const before = tasks.get('TASK-001');
    expect(before!.started_at).toBeNull();
    tasks.updateStatus('TASK-001', 'in-progress');
    const after = tasks.get('TASK-001');
    expect(after!.started_at).not.toBeNull();
  });

  test('update sets completed_at when moving to done', () => {
    tasks.create({ title: 'Test', assigned_to: 'pm' });
    tasks.updateStatus('TASK-001', 'done');
    const task = tasks.get('TASK-001');
    expect(task!.completed_at).not.toBeNull();
  });
});
