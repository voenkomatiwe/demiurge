// backend/src/routes/agents.ts
import type { FastifyInstance } from 'fastify';
import type { AgentService, TaskService, MemoryService, DemiurgeConfig } from '@demiurge/core';
import { compilePrompt, ClaudeCodeExecutor, CodexExecutor, getExecutionMode } from '@demiurge/core';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

interface AgentRouteDeps {
  agents: AgentService;
  tasks: TaskService;
  memory: MemoryService;
  config: DemiurgeConfig;
  projectDir: string;
}

export function registerAgentRoutes(app: FastifyInstance, deps: AgentRouteDeps): void {
  const { agents, tasks, memory, config, projectDir } = deps;

  app.get('/api/v1/agents/sessions', async (req) => {
    const { task_id, status } = req.query as Record<string, string>;
    return agents.listSessions({ task_id, status: status as any });
  });

  app.get('/api/v1/agents/sessions/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const session = agents.getSession(id);
    if (!session) return reply.status(404).send({ error: 'Not found', code: 'SESSION_NOT_FOUND' });
    return session;
  });

  app.post('/api/v1/agents/run', async (req, reply) => {
    const body = req.body as { agent: string; task_id: string };

    const task = tasks.get(body.task_id);
    if (!task) return reply.status(404).send({ error: 'Task not found', code: 'TASK_NOT_FOUND' });

    const agentPromptPath = join(projectDir, 'agents', body.agent, 'agent.md');
    if (!existsSync(agentPromptPath)) {
      return reply.status(400).send({ error: `Agent prompt not found: ${body.agent}`, code: 'AGENT_NOT_FOUND' });
    }

    const agentPrompt = readFileSync(agentPromptPath, 'utf-8');
    const memoryBank = memory.get();
    const mode = getExecutionMode(config);
    const compiledPrompt = compilePrompt({ agentPrompt, task, memoryBank, projectDir, mode });

    const model = config.agents[body.agent as keyof typeof config.agents]?.model ?? config.model;
    const executor = config.executor === 'codex' ? new CodexExecutor() : new ClaudeCodeExecutor();

    const session = agents.createSession(body.task_id, body.agent as any, config.executor);

    // Run agent in background (don't await — return session immediately)
    executor.run({
      agent: { role: body.agent as any, model, promptPath: agentPromptPath },
      task,
      compiledPrompt,
      projectDir,
    }).then((result) => {
      agents.complete(session.id, result.status, result.log);
    }).catch((err) => {
      agents.complete(session.id, 'failed', String(err));
    });

    return reply.status(201).send(session);
  });

  app.post('/api/v1/agents/stop', async (req, reply) => {
    const body = req.body as { session_id: string };
    const session = agents.getSession(body.session_id);
    if (!session) return reply.status(404).send({ error: 'Not found', code: 'SESSION_NOT_FOUND' });
    if (session.pid) {
      try { process.kill(session.pid, 'SIGTERM'); } catch {}
    }
    agents.complete(body.session_id, 'failed', 'Stopped by user');
    return reply.status(200).send({ status: 'stopped' });
  });
}
