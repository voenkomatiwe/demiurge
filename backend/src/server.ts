// backend/src/server.ts
import Fastify from 'fastify';
import { join } from 'node:path';
import {
  createClient, initSchema, SQLiteAdapter,
  TaskService, DocumentService, AgentService, DecisionService, MemoryService,
  loadConfig,
} from '@demiurge/core';
import { registerCors } from './plugins/cors';
import { registerSwagger } from './plugins/swagger';
import { registerStatic } from './plugins/static';
import { registerTaskRoutes } from './routes/tasks';
import { registerDocumentRoutes } from './routes/documents';
import { registerAgentRoutes } from './routes/agents';
import { registerDecisionRoutes } from './routes/decisions';
import { registerMemoryRoutes } from './routes/memory';

interface AppOptions {
  projectDir: string;
}

export async function createApp(options: AppOptions) {
  const app = Fastify({ logger: false });
  const dbPath = join(options.projectDir, '.demiurge', 'data.db');
  const db = createClient(dbPath);

  // Get project ID
  const project = db.query('SELECT id FROM projects LIMIT 1').get() as { id: string };
  const projectId = project.id;
  const adapter = new SQLiteAdapter(db);

  // Services
  const tasks = new TaskService(adapter, projectId);
  const documents = new DocumentService(adapter, projectId);
  const agents = new AgentService(adapter);
  const decisions = new DecisionService(adapter, projectId);
  const memory = new MemoryService(adapter, projectId);

  // Plugins
  await registerCors(app);
  await registerSwagger(app);

  // Routes
  registerTaskRoutes(app, tasks);
  registerDocumentRoutes(app, documents);
  const config = loadConfig(options.projectDir);
  registerAgentRoutes(app, { agents, tasks, memory, config, projectDir: options.projectDir });
  registerDecisionRoutes(app, decisions);
  registerMemoryRoutes(app, memory);

  // Static SPA serving (must be last — catches unmatched routes)
  await registerStatic(app);

  // Cleanup on close
  app.addHook('onClose', () => {
    db.close();
  });

  return app;
}

// Direct execution
if (import.meta.main) {
  const projectDir = process.cwd();
  const app = await createApp({ projectDir });
  await app.listen({ port: 4400, host: '0.0.0.0' });
}
