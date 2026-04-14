// cli/src/utils.ts
import { existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import {
  createClient,
  SQLiteAdapter,
  loadConfig,
  TaskService,
  DocumentService,
  AgentService,
  DecisionService,
  MemoryService,
} from '@demiurge/core';
import type { DemiurgeConfig } from '@demiurge/core';

export interface ProjectContext {
  projectDir: string;
  projectId: string;
  config: DemiurgeConfig;
  adapter: SQLiteAdapter;
  tasks: TaskService;
  documents: DocumentService;
  agents: AgentService;
  decisions: DecisionService;
  memory: MemoryService;
}

export function getProjectDir(): string {
  return resolve(process.cwd());
}

export function loadProject(projectDir?: string): ProjectContext {
  const dir = projectDir ?? getProjectDir();
  const dbPath = join(dir, '.demiurge', 'data.db');

  if (!existsSync(dbPath)) {
    console.error(
      'Error: No demiurge project found. Run "demiurge init" first.',
    );
    process.exit(1);
  }

  const config = loadConfig(dir);
  const db = createClient(dbPath);
  const adapter = new SQLiteAdapter(db);

  // Get the project ID (first project in DB — single-project mode)
  const project = db.query('SELECT id FROM projects LIMIT 1').get() as {
    id: string;
  } | null;
  if (!project) {
    console.error(
      'Error: Database exists but no project found. Re-run "demiurge init".',
    );
    process.exit(1);
  }

  const projectId = project.id;

  return {
    projectDir: dir,
    projectId,
    config,
    adapter,
    tasks: new TaskService(adapter, projectId),
    documents: new DocumentService(adapter, projectId),
    agents: new AgentService(adapter),
    decisions: new DecisionService(adapter, projectId),
    memory: new MemoryService(adapter, projectId),
  };
}
