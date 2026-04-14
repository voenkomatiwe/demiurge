// packages/core/src/services/documents.ts
import { randomUUID } from 'node:crypto';
import type { StorageAdapter } from '../adapters/storage';
import type { Document, DocumentFilter, DocumentType } from '../types';

interface CreateDocumentInput {
  filename: string;
  content: string;
  type: DocumentType;
}

export class DocumentService {
  constructor(
    private adapter: StorageAdapter,
    private projectId: string,
  ) {}

  create(input: CreateDocumentInput): Document {
    const doc: Document = {
      id: randomUUID(),
      project_id: this.projectId,
      filename: input.filename,
      content: input.content,
      type: input.type,
      created_at: new Date().toISOString(),
    };
    this.adapter.createDocument(doc);
    return doc;
  }

  get(id: string): Document | null {
    return this.adapter.getDocument(id);
  }

  list(filter: DocumentFilter = {}): Document[] {
    return this.adapter.listDocuments(this.projectId, filter);
  }

  delete(id: string): void {
    this.adapter.deleteDocument(id);
  }
}
