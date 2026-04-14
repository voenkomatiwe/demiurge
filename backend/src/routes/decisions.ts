// backend/src/routes/decisions.ts
import type { FastifyInstance } from 'fastify';
import type { DecisionService } from '@demiurge/core';

export function registerDecisionRoutes(app: FastifyInstance, decisions: DecisionService): void {
  app.get('/api/v1/decisions', async (req) => {
    const { tags } = req.query as Record<string, string>;
    const filter = tags ? { tags: tags.split(',') } : {};
    return decisions.list(filter);
  });

  app.post('/api/v1/decisions', async (req, reply) => {
    const body = req.body as { title: string; decision: string; reason?: string; tags?: string[] };
    const d = decisions.create(body);
    return reply.status(201).send(d);
  });
}
