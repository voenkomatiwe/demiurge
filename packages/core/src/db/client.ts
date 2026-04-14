// packages/core/src/db/client.ts
import { Database } from 'bun:sqlite';

export function createClient(path: string): Database {
  const db = new Database(path, { create: true });
  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');
  return db;
}

export function resolveDbPath(projectDir: string): string {
  return `${projectDir}/.demiurge/data.db`;
}
