// backend/__tests__/routes.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createApp } from '../src/server';
import { mkdirSync, rmSync } from 'node:fs';
import type { FastifyInstance } from 'fastify';

const TEST_DIR = '/tmp/demiurge-backend-test';

describe('API Routes', () => {
  let app: FastifyInstance;

  beforeEach(async () => {
    rmSync(TEST_DIR, { recursive: true, force: true });
    mkdirSync(`${TEST_DIR}/.demiurge`, { recursive: true });

    // Init DB via core
    const { createClient, initSchema, SQLiteAdapter } = await import('@demiurge/core');
    const db = createClient(`${TEST_DIR}/.demiurge/data.db`);
    initSchema(db);
    const adapter = new SQLiteAdapter(db);
    adapter.createProject({ id: 'proj-1', name: 'Test', path: TEST_DIR, created_at: new Date().toISOString() });
    db.close();

    app = await createApp({ projectDir: TEST_DIR });
  });

  afterEach(async () => {
    await app.close();
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  // --- Tasks ---

  test('POST /api/v1/tasks creates a task', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/tasks',
      payload: { title: 'Test task', assigned_to: 'pm' },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.id).toBe('TASK-001');
    expect(body.status).toBe('new');
  });

  test('GET /api/v1/tasks lists tasks', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/tasks', payload: { title: 'T1', assigned_to: 'pm' } });
    await app.inject({ method: 'POST', url: '/api/v1/tasks', payload: { title: 'T2', assigned_to: 'frontend' } });

    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toHaveLength(2);
  });

  test('GET /api/v1/tasks?status=new filters', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/tasks', payload: { title: 'T1', assigned_to: 'pm' } });
    const res = await app.inject({ method: 'GET', url: '/api/v1/tasks?status=new' });
    expect(res.json()).toHaveLength(1);
  });

  test('PATCH /api/v1/tasks/:id updates fields', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/tasks', payload: { title: 'T1', assigned_to: 'pm' } });
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/tasks/TASK-001',
      payload: { status: 'in-progress', plan: 'Do stuff' },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().status).toBe('in-progress');
  });

  test('DELETE /api/v1/tasks/:id removes task', async () => {
    await app.inject({ method: 'POST', url: '/api/v1/tasks', payload: { title: 'T1', assigned_to: 'pm' } });
    const res = await app.inject({ method: 'DELETE', url: '/api/v1/tasks/TASK-001' });
    expect(res.statusCode).toBe(204);
  });

  // --- Documents ---

  test('POST + GET /api/v1/documents', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/api/v1/documents',
      payload: { filename: 'spec.md', content: '# Spec', type: 'intake' },
    });
    expect(create.statusCode).toBe(201);

    const list = await app.inject({ method: 'GET', url: '/api/v1/documents' });
    expect(list.json()).toHaveLength(1);
  });

  // --- Memory ---

  test('PUT + GET /api/v1/memory', async () => {
    await app.inject({
      method: 'PUT',
      url: '/api/v1/memory',
      payload: { content: 'Active: TASK-001' },
    });
    const res = await app.inject({ method: 'GET', url: '/api/v1/memory' });
    expect(res.json().content).toBe('Active: TASK-001');
  });
});
