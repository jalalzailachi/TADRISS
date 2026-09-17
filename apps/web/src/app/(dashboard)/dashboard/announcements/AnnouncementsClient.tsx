'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  createAnnouncement,
  togglePinAnnouncement,
  deleteAnnouncement,
} from '@/app/actions/announcements';

interface Announcement {
  id: string;
  title: string;
  message: string;
  audience: 'all' | 'teachers' | 'students' | 'parents';
  is_pinned: boolean;
  created_at: string;
}

const audienceLabel: Record<Announcement['audience'], string> = {
  all: 'Everyone',
  teachers: 'Teachers',
  students: 'Students',
  parents: 'Parents',
};

export function AnnouncementsClient({ items }: { items: Announcement[] }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] =
    useState<Announcement['audience']>('all');
  const [isPinned, setIsPinned] = useState(false);

  const resetForm = () => {
    setTitle('');
    setMessage('');
    setAudience('all');
    setIsPinned(false);
  };

  const submit = () => {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    startTransition(async () => {
      const result = await createAnnouncement({
        title,
        message,
        audience,
        is_pinned: isPinned,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success('Announcement posted');
        resetForm();
        setOpen(false);
      }
    });
  };

  const onTogglePin = (a: Announcement) => {
    startTransition(async () => {
      const result = await togglePinAnnouncement(a.id, !a.is_pinned);
      if (result.error) toast.error(result.error);
    });
  };

  const onDelete = (a: Announcement) => {
    if (!confirm('Delete this announcement?')) return;
    startTransition(async () => {
      const result = await deleteAnnouncement(a.id);
      if (result.error) toast.error(result.error);
      else toast.success('Deleted');
    });
  };

  return (
    <div className="px-6 md:px-12 py-8">
      <PageHeader
        title="Announcements"
        subtitle="Broadcast news to teachers, students, and parents"
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New announcement
          </button>
        }
      />

      <div className="mt-6 space-y-4">
        {items.length === 0 ? (
          <EmptyState
            icon="campaign"
            title="No announcements yet"
            description="Post your first announcement to keep everyone informed."
          />
        ) : (
          items.map((a) => (
            <article
              key={a.id}
              className={`card-premium p-6 ${
                a.is_pinned ? 'border-primary/40' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {a.is_pinned && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary-container/20 text-primary px-2 py-0.5 text-xs font-semibold">
                        <span className="material-symbols-outlined text-[14px]">
                          push_pin
                        </span>
                        Pinned
                      </span>
                    )}
                    <span className="rounded-full bg-surface-container px-2 py-0.5 text-xs text-on-surface-variant">
                      {audienceLabel[a.audience]}
                    </span>
                    <span className="text-xs text-on-surface-variant">
                      {new Date(a.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">
                    {a.title}
                  </h3>
                  <div
                    className="prose prose-sm mt-2 max-w-none text-on-surface-variant"
                    dangerouslySetInnerHTML={{ __html: a.message }}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => onTogglePin(a)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-outline hover:bg-surface-container-low hover:text-on-surface transition-colors"
                    aria-label={a.is_pinned ? 'Unpin' : 'Pin'}
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {a.is_pinned ? 'keep_off' : 'push_pin'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(a)}
                    disabled={isPending}
                    className="rounded-lg p-2 text-outline hover:bg-error-soft hover:text-on-error-soft transition-colors"
                    aria-label="Delete"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title="New announcement"
        description="Broadcast to everyone in your institution"
        width="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="h-11 rounded-xl border border-outline-variant/40 px-4 text-sm font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={isPending}
              className="h-11 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary disabled:opacity-60"
            >
              {isPending ? 'Posting…' : 'Post'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1 block">
              Message
            </label>
            <RichTextEditor value={message} onChange={setMessage} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Audience
            </label>
            <select
              value={audience}
              onChange={(e) =>
                setAudience(e.target.value as Announcement['audience'])
              }
            >
              <option value="all">Everyone</option>
              <option value="teachers">Teachers only</option>
              <option value="students">Students only</option>
              <option value="parents">Parents only</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPinned}
              onChange={(e) => setIsPinned(e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm text-on-surface">Pin to top</span>
          </label>
        </div>
      </SlideOver>
    </div>
  );
}
