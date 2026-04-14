// packages/core/src/services/memory.ts
import type { StorageAdapter } from '../adapters/storage';

export class MemoryService {
  constructor(
    private adapter: StorageAdapter,
    private projectId: string,
  ) {}

  get(): string | null {
    const mem = this.adapter.getMemory(this.projectId);
    return mem?.content ?? null;
  }

  set(content: string): void {
    this.adapter.upsertMemory({
      id: `mem-${this.projectId}`,
      project_id: this.projectId,
      content,
      updated_at: new Date().toISOString(),
    });
  }
}
