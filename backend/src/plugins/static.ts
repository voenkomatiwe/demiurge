// backend/src/plugins/static.ts
import type { FastifyInstance } from 'fastify';
import fastifyStatic from '@fastify/static';
import { join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

export async function registerStatic(app: FastifyInstance): Promise<void> {
  // Serve frontend build from frontend/dist/
  // Walk up from backend/src to find frontend/dist
  let root = dirname(new URL(import.meta.url).pathname);
  while (root !== '/') {
    const candidate = join(root, 'frontend', 'dist');
    if (existsSync(candidate)) {
      await app.register(fastifyStatic, {
        root: candidate,
        prefix: '/',
        wildcard: false,
      });
      // SPA fallback: serve index.html for non-API routes
      app.setNotFoundHandler((_req, reply) => {
        reply.sendFile('index.html');
      });
      return;
    }
    root = dirname(root);
  }
  // No frontend build found — skip static serving
}
