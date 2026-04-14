// backend/src/routes/memory.ts
import type { FastifyInstance } from 'fastify';
import type { MemoryService } from '@demiurge/core';

export function registerMemoryRoutes(app: FastifyInstance, memory: MemoryService): void {
  app.get('/api/v1/memory', async () => {
    const content = memory.get();
    return { content: content ?? '' };
  });

  app.put('/api/v1/memory', async (req) => {
    const body = req.body as { content: string };
    memory.set(body.content);
    return { status: 'updated' };
  });
}
