// packages/core/__tests__/db.test.ts
import { describe, test, expect, beforeEach, afterEach } from 'bun:test';
import { createClient } from '../src/db/client';
import { initSchema } from '../src/db/schema';
import { unlinkSync } from 'node:fs';

const TEST_DB = '/tmp/demiurge-test.db';

describe('DB Schema', () => {
  let db: ReturnType<typeof createClient>;

  beforeEach(() => {
    db = createClient(TEST_DB);
    initSchema(db);
  });

  afterEach(() => {
    db.close();
    try { unlinkSync(TEST_DB); } catch {}
  });

  test('creates all tables', () => {
    const tables = db
      .query("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain('projects');
    expect(names).toContain('tasks');
    expect(names).toContain('documents');
    expect(names).toContain('agent_sessions');
    expect(names).toContain('decisions');
    expect(names).toContain('memory_bank');
  });

  test('projects table accepts insert', () => {
    db.run(
      "INSERT INTO projects (id, name, path, created_at) VALUES (?, ?, ?, ?)",
      ['proj-1', 'test', '/tmp/test', new Date().toISOString()],
    );
    const row = db.query("SELECT * FROM projects WHERE id = ?").get('proj-1') as Record<string, unknown>;
    expect(row.name).toBe('test');
    expect(row.path).toBe('/tmp/test');
  });

  test('tasks table enforces NOT NULL on status', () => {
    db.run(
      "INSERT INTO projects (id, name, path, created_at) VALUES (?, ?, ?, ?)",
      ['proj-1', 'test', '/tmp/test', new Date().toISOString()],
    );
    expect(() =>
      db.run(
        "INSERT INTO tasks (id, project_id, title) VALUES (?, ?, ?)",
        ['TASK-001', 'proj-1', 'Test'],
      ),
    ).toThrow();
  });

  test('WAL mode is enabled', () => {
    const result = db.query("PRAGMA journal_mode").get() as { journal_mode: string };
    expect(result.journal_mode).toBe('wal');
  });
});
