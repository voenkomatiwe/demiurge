// packages/core/__tests__/prompt-compiler.test.ts
import { describe, test, expect } from 'bun:test';
import { compilePrompt, getInteractionInstructions } from '../src/executors/prompt-compiler';
import type { Task } from '../src/types';

describe('PromptCompiler', () => {
  const task: Task = {
    id: 'TASK-001-frontend',
    project_id: 'proj-1',
    parent_id: 'TASK-001',
    assigned_to: 'frontend',
    status: 'new',
    title: 'Build login page',
    goal: 'Create a responsive login form',
    not_doing: 'No OAuth yet',
    design_ref: null,
    plan: null,
    progress: null,
    review: null,
    revisions: null,
    workspace: ['frontend/src/pages/', 'frontend/src/components/auth/'],
    dependencies: ['TASK-001-designer'],
    created_at: '2026-04-14T10:00:00Z',
    started_at: null,
    completed_at: null,
  };

  test('includes task goal and title', () => {
    const prompt = compilePrompt({
      agentPrompt: '# Frontend Agent\nYou build React components.',
      task,
      memoryBank: null,
      projectDir: '/home/user/project',
    });
    expect(prompt).toContain('Build login page');
    expect(prompt).toContain('Create a responsive login form');
  });

  test('includes workspace directories', () => {
    const prompt = compilePrompt({
      agentPrompt: '# Frontend Agent',
      task,
      memoryBank: null,
      projectDir: '/home/user/project',
    });
    expect(prompt).toContain('frontend/src/pages/');
    expect(prompt).toContain('frontend/src/components/auth/');
  });

  test('includes CLI instructions for task updates', () => {
    const prompt = compilePrompt({
      agentPrompt: '# Frontend Agent',
      task,
      memoryBank: null,
      projectDir: '/home/user/project',
    });
    expect(prompt).toContain('demiurge task update');
  });

  test('includes memory bank when provided', () => {
    const prompt = compilePrompt({
      agentPrompt: '# Frontend Agent',
      task,
      memoryBank: 'Active: TASK-001, step 3 complete',
      projectDir: '/home/user/project',
    });
    expect(prompt).toContain('Active: TASK-001, step 3 complete');
  });

  test('includes not_doing exclusions', () => {
    const prompt = compilePrompt({
      agentPrompt: '# Frontend Agent',
      task,
      memoryBank: null,
      projectDir: '/home/user/project',
    });
    expect(prompt).toContain('No OAuth yet');
  });

  test('local mode includes demiurge CLI commands', () => {
    const prompt = compilePrompt({
      agentPrompt: '# Agent',
      task,
      memoryBank: null,
      projectDir: '/tmp',
      mode: 'local',
    });
    expect(prompt).toContain('demiurge task update');
    expect(prompt).toContain('demiurge memory');
  });

  test('github mode includes gh CLI commands', () => {
    const prompt = compilePrompt({
      agentPrompt: '# Agent',
      task,
      memoryBank: null,
      projectDir: '/tmp',
      mode: 'github',
    });
    expect(prompt).toContain('gh issue edit');
    expect(prompt).toContain('gh issue comment');
    expect(prompt).not.toContain('demiurge task');
  });

  test('defaults to local mode', () => {
    const prompt = compilePrompt({
      agentPrompt: '# Agent',
      task,
      memoryBank: null,
      projectDir: '/tmp',
    });
    expect(prompt).toContain('demiurge task update');
  });
});
