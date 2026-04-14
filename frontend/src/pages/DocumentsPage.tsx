import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Document } from '@/lib/api';

export function DocumentsPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { data: docs = [] } = useQuery({ queryKey: ['documents'], queryFn: () => api.documents.list() });
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const uploadMutation = useMutation({
    mutationFn: async (files: FileList) => {
      for (const file of Array.from(files)) {
        const content = await file.text();
        await api.documents.create({ filename: file.name, content, type: 'intake' });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['documents'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.documents.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      setSelectedDoc(null);
    },
  });

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
      uploadMutation.mutate(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-foreground">Documents</h2>

      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click();
        }}
        role="button"
        tabIndex={0}
        className="border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
      >
        <p className="text-muted-foreground">Drop files here or click to upload</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && uploadMutation.mutate(e.target.files)}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          {docs.map((doc: Document) => (
            <div
              key={doc.id}
              onClick={() => setSelectedDoc(doc)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setSelectedDoc(doc);
              }}
              role="button"
              tabIndex={0}
              className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer text-sm ${selectedDoc?.id === doc.id ? 'border-primary' : 'border-border hover:bg-muted/50'}`}
            >
              <span className="font-medium text-foreground">{doc.filename}</span>
              <span className="text-xs text-muted-foreground ml-auto">{doc.type}</span>
            </div>
          ))}
          {docs.length === 0 && <p className="text-muted-foreground text-sm">No documents yet.</p>}
        </div>

        {selectedDoc && (
          <div className="rounded-lg border border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-foreground">{selectedDoc.filename}</h3>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(selectedDoc.id)}
                className="text-xs text-destructive hover:underline"
              >
                Delete
              </button>
            </div>
            <pre className="text-xs text-foreground whitespace-pre-wrap bg-muted p-3 rounded-md max-h-96 overflow-auto">
              {selectedDoc.content}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
