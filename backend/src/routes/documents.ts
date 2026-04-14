// backend/src/routes/documents.ts
import type { FastifyInstance } from 'fastify';
import type { DocumentService } from '@demiurge/core';

export function registerDocumentRoutes(app: FastifyInstance, documents: DocumentService): void {
  app.get('/api/v1/documents', async (req) => {
    const { type } = req.query as Record<string, string>;
    return documents.list({ type: type as any });
  });

  app.get('/api/v1/documents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const doc = documents.get(id);
    if (!doc) return reply.status(404).send({ error: 'Not found', code: 'DOCUMENT_NOT_FOUND' });
    return doc;
  });

  app.post('/api/v1/documents', async (req, reply) => {
    const body = req.body as { filename: string; content: string; type: string };
    const doc = documents.create({ filename: body.filename, content: body.content, type: body.type as any });
    return reply.status(201).send(doc);
  });

  app.delete('/api/v1/documents/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    documents.delete(id);
    return reply.status(204).send();
  });
}
