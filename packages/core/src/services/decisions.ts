// packages/core/src/services/decisions.ts
import type { StorageAdapter } from '../adapters/storage';
import type { Decision, DecisionFilter } from '../types';

interface CreateDecisionInput {
  title: string;
  decision: string;
  reason?: string;
  tags?: string[];
}

export class DecisionService {
  constructor(
    private adapter: StorageAdapter,
    private projectId: string,
  ) {}

  create(input: CreateDecisionInput): Decision {
    return this.adapter.createDecision({
      project_id: this.projectId,
      title: input.title,
      decision: input.decision,
      reason: input.reason ?? null,
      tags: input.tags ?? null,
      created_at: new Date().toISOString(),
    });
  }

  list(filter: DecisionFilter = {}): Decision[] {
    return this.adapter.listDecisions(this.projectId, filter);
  }
}
