// packages/core/src/db/schema.ts
import type { Database } from 'bun:sqlite';

const TABLES = `
CREATE TABLE IF NOT EXISTS projects (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  path       TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS documents (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  filename   TEXT NOT NULL,
  content    TEXT NOT NULL,
  type       TEXT NOT NULL CHECK(type IN ('intake', 'brief', 'architecture')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS tasks (
  id           TEXT PRIMARY KEY,
  project_id   TEXT NOT NULL REFERENCES projects(id),
  parent_id    TEXT REFERENCES tasks(id),
  assigned_to  TEXT,
  status       TEXT NOT NULL CHECK(status IN ('new','blocked','in-progress','review','revision','approved','done')),
  title        TEXT NOT NULL,
  goal         TEXT,
  not_doing    TEXT,
  design_ref   TEXT,
  plan         TEXT,
  progress     TEXT,
  review       TEXT,
  revisions    TEXT,
  workspace    TEXT,
  dependencies TEXT,
  created_at   TEXT NOT NULL,
  started_at   TEXT,
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS agent_sessions (
  id           TEXT PRIMARY KEY,
  task_id      TEXT NOT NULL REFERENCES tasks(id),
  agent        TEXT NOT NULL,
  executor     TEXT NOT NULL CHECK(executor IN ('claude-code', 'codex', 'github-actions')),
  status       TEXT NOT NULL CHECK(status IN ('running', 'completed', 'failed')),
  started_at   TEXT NOT NULL,
  completed_at TEXT,
  pid          INTEGER,
  log          TEXT
);

CREATE TABLE IF NOT EXISTS decisions (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id TEXT NOT NULL REFERENCES projects(id),
  title      TEXT NOT NULL,
  decision   TEXT NOT NULL,
  reason     TEXT,
  tags       TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memory_bank (
  id         TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id),
  content    TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
`;

export function initSchema(db: Database): void {
  db.exec(TABLES);
}
