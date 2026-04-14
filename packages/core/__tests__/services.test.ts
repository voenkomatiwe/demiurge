// packages/core/__tests__/services.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createClient } from '../src/db/client';
import { initSchema } from '../src/db/schema';
import { SQLiteAdapter } from '../src/adapters/sqlite';
import { TaskService } from '../src/services/tasks';
import { DocumentService } from '../src/services/documents';
import { DecisionService } from '../src/services/decisions';
import { MemoryService } from '../src/services/memory';
import { unlinkSync } from 'node:fs';

const TEST_DB = '/tmp/demiurge-services-test.db';
const PROJECT_ID = 'proj-1';

describe('Services', () => {
  let adapter: SQLiteAdapter;
  let tasks: TaskService;
  let documents: DocumentService;
  let decisions: DecisionService;
  let memory: MemoryService;

  beforeEach(() => {
    const db = createClient(TEST_DB);
    initSchema(db);
    adapter = new SQLiteAdapter(db);
    adapter.createProject({ id: PROJECT_ID, name: 'Test', path: '/tmp', created_at: new Date().toISOString() });
    tasks = new TaskService(adapter, PROJECT_ID);
    documents = new DocumentService(adapter, PROJECT_ID);
    decisions = new DecisionService(adapter, PROJECT_ID);
    memory = new MemoryService(adapter, PROJECT_ID);
  });

  afterEach(() => {
    adapter.close();
    try { unlinkSync(TEST_DB); } catch {}
  });

  test('TaskService.create auto-generates ID', () => {
    const task = tasks.create({ title: 'First task', assigned_to: 'pm' });
    expect(task.id).toBe('TASK-001');
    expect(task.status).toBe('new');

    const task2 = tasks.create({ title: 'Second task', assigned_to: 'frontend' });
    expect(task2.id).toBe('TASK-002');
  });

  test('TaskService.createSubtask generates child ID', () => {
    tasks.create({ title: 'Parent', assigned_to: 'pm' });
    const sub = tasks.createSubtask('TASK-001', { title: 'Frontend work', assigned_to: 'frontend' });
    expect(sub.id).toBe('TASK-001-frontend');
    expect(sub.parent_id).toBe('TASK-001');
  });

  test('TaskService.updateStatus validates transitions', () => {
    tasks.create({ title: 'Test', assigned_to: 'pm' });
    tasks.updateStatus('TASK-001', 'in-progress');
    const t = tasks.get('TASK-001');
    expect(t!.status).toBe('in-progress');
    expect(t!.started_at).not.toBeNull();
  });

  test('TaskService.updateStatus sets completed_at for done', () => {
    tasks.create({ title: 'Test', assigned_to: 'pm' });
    tasks.updateStatus('TASK-001', 'done');
    const t = tasks.get('TASK-001');
    expect(t!.completed_at).not.toBeNull();
  });

  test('DocumentService.create and get', () => {
    const doc = documents.create({
      filename: 'brief.md',
      content: '# Project Brief\nBuild something cool',
      type: 'intake',
    });
    expect(doc.id).toBeTruthy();
    const retrieved = documents.get(doc.id);
    expect(retrieved!.content).toContain('Build something cool');
  });

  test('DecisionService.create and filter', () => {
    decisions.create({ title: 'Use React', decision: 'React', reason: 'Team', tags: ['frontend'] });
    decisions.create({ title: 'Use Fastify', decision: 'Fastify', reason: 'Fast', tags: ['backend'] });
    const frontend = decisions.list({ tags: ['frontend'] });
    expect(frontend).toHaveLength(1);
  });

  test('MemoryService.set and get', () => {
    memory.set('Active: TASK-001');
    const content = memory.get();
    expect(content).toBe('Active: TASK-001');

    memory.set('Updated');
    expect(memory.get()).toBe('Updated');
  });
});
