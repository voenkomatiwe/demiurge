// backend/src/plugins/swagger.ts
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: { title: 'Demiurge API', version: '0.2.0' },
    },
  });
  await app.register(swaggerUi, { routePrefix: '/docs' });
}
