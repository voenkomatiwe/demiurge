// backend/src/routes/tasks.ts
import type { FastifyInstance } from 'fastify';
import type { TaskService } from '@demiurge/core';

export function registerTaskRoutes(app: FastifyInstance, tasks: TaskService): void {
  app.get('/api/v1/tasks', async (req) => {
    const { status, assigned_to, parent_id } = req.query as Record<string, string>;
    return tasks.list({ status: status as any, assigned_to: assigned_to as any, parent_id });
  });

  app.get('/api/v1/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const task = tasks.get(id);
    if (!task) return reply.status(404).send({ error: 'Not found', code: 'TASK_NOT_FOUND' });
    return task;
  });

  app.post('/api/v1/tasks', async (req, reply) => {
    const body = req.body as { title: string; assigned_to?: string; goal?: string; parent?: string; workspace?: string[] };
    let task;
    if (body.parent) {
      task = tasks.createSubtask(body.parent, {
        title: body.title,
        assigned_to: body.assigned_to as any,
        goal: body.goal,
        workspace: body.workspace,
      });
    } else {
      task = tasks.create({
        title: body.title,
        assigned_to: body.assigned_to as any,
        goal: body.goal,
        workspace: body.workspace,
      });
    }
    return reply.status(201).send(task);
  });

  app.patch('/api/v1/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const body = req.body as Record<string, unknown>;
    if (body.status) {
      tasks.updateStatus(id, body.status as any);
      delete body.status;
    }
    if (Object.keys(body).length > 0) {
      tasks.update(id, body);
    }
    const updated = tasks.get(id);
    if (!updated) return reply.status(404).send({ error: 'Not found', code: 'TASK_NOT_FOUND' });
    return updated;
  });

  app.delete('/api/v1/tasks/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    tasks.delete(id);
    return reply.status(204).send();
  });
}
