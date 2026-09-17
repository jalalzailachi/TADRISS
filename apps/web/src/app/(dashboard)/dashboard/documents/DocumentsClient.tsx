'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { EmptyState } from '@/components/ui/EmptyState';
import { createDocument, deleteDocument } from '@/app/actions/documents';

interface Document {
  id: string;
  name: string;
  file_url: string;
  file_type: string | null;
  size_bytes: number | null;
  category: string | null;
  uploaded_at: string;
  student_id: string | null;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

function humanSize(bytes: number | null) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentsClient({
  documents,
  students,
}: {
  documents: Document[];
  students: Student[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileType, setFileType] = useState('');
  const [category, setCategory] = useState('');
  const [studentId, setStudentId] = useState<string>('');

  const reset = () => {
    setName('');
    setFileUrl('');
    setFileType('');
    setCategory('');
    setStudentId('');
  };

  const submit = () => {
    if (!name.trim() || !fileUrl.trim()) {
      toast.error('Name and file URL required');
      return;
    }
    startTransition(async () => {
      const result = await createDocument({
        name,
        file_url: fileUrl,
        file_type: fileType || undefined,
        category: category || undefined,
        student_id: studentId || undefined,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success('Document added');
        reset();
        setOpen(false);
      }
    });
  };

  const onDelete = (d: Document) => {
    if (!confirm(`Delete "${d.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteDocument(d.id);
      if (result.error) toast.error(result.error);
      else toast.success('Deleted');
    });
  };

  const studentMap = new Map(students.map((s) => [s.id, s]));

  return (
    <div className="px-6 md:px-12 py-8">
      <PageHeader
        title="Documents"
        subtitle="Institution file repository"
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">upload</span>
            Add document
          </button>
        }
      />

      <div className="mt-6 card-premium overflow-hidden">
        {documents.length === 0 ? (
          <EmptyState
            icon="folder_open"
            title="No documents yet"
            description="Upload policies, forms, and handbooks."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 text-start font-semibold">Name</th>
                <th className="px-6 py-3 text-start font-semibold">Category</th>
                <th className="px-6 py-3 text-start font-semibold">Linked to</th>
                <th className="px-6 py-3 text-start font-semibold">Size</th>
                <th className="px-6 py-3 text-start font-semibold">Uploaded</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {documents.map((d) => {
                const student = d.student_id ? studentMap.get(d.student_id) : null;
                return (
                  <tr key={d.id} className="hover:bg-surface-container-low/50">
                    <td className="px-6 py-4 font-medium text-on-surface">
                      <a
                        href={d.file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 hover:text-primary"
                      >
                        <span className="material-symbols-outlined text-[18px] text-outline">
                          description
                        </span>
                        {d.name}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {d.category ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-on-surface-variant">
                      {student
                        ? `${student.first_name} ${student.last_name}`
                        : 'Institution'}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-on-surface-variant">
                      {humanSize(d.size_bytes)}
                    </td>
                    <td className="px-6 py-4 text-xs text-on-surface-variant">
                      {new Date(d.uploaded_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-end">
                      <button
                        type="button"
                        onClick={() => onDelete(d)}
                        disabled={isPending}
                        className="rounded-lg p-2 text-outline hover:bg-error-soft hover:text-on-error-soft transition-colors"
                        aria-label="Delete"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          delete
                        </span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title="Add document"
        description="Paste a file URL from your Supabase Storage bucket"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Name
            </label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              File URL
            </label>
            <input
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              File type
            </label>
            <input
              value={fileType}
              onChange={(e) => setFileType(e.target.value)}
              placeholder="pdf, docx, jpg…"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Category
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Policy, Form, Handbook…"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Link to student (optional)
            </label>
            <select
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
            >
              <option value="">— Institution-level —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.first_name} {s.last_name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
