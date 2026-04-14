// cli/__tests__/init-command.test.ts
import { describe, test, expect, afterEach } from 'bun:test';
import { existsSync, rmSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const TEST_DIR = '/tmp/demiurge-init-test';

describe('demiurge init', () => {
  afterEach(() => {
    rmSync(TEST_DIR, { recursive: true, force: true });
  });

  test('creates .demiurge directory and config', async () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const { initProject } = await import('../src/commands/init');
    initProject(TEST_DIR, { project: 'test-proj', executor: 'claude-code', ui: false, yes: true });

    expect(existsSync(join(TEST_DIR, '.demiurge', 'data.db'))).toBe(true);
    expect(existsSync(join(TEST_DIR, 'demiurge.config.json'))).toBe(true);
  });

  test('config contains correct executor', async () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const { initProject } = await import('../src/commands/init');
    initProject(TEST_DIR, { project: 'test-proj', executor: 'codex', ui: false, yes: true });

    const config = JSON.parse(readFileSync(join(TEST_DIR, 'demiurge.config.json'), 'utf-8'));
    expect(config.executor).toBe('codex');
  });

  test('initializes SQLite with tables', async () => {
    mkdirSync(TEST_DIR, { recursive: true });
    const { initProject } = await import('../src/commands/init');
    initProject(TEST_DIR, { project: 'test-proj', executor: 'claude-code', ui: false, yes: true });

    const { createClient } = await import('@demiurge/core');
    const db = createClient(join(TEST_DIR, '.demiurge', 'data.db'));
    const tables = db.query("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
    const names = tables.map((t) => t.name);
    expect(names).toContain('projects');
    expect(names).toContain('tasks');
    db.close();
  });
});
