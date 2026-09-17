'use client';

import { useState, useTransition, useMemo } from 'react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { EmptyState } from '@/components/ui/EmptyState';
import { sendMessage, markMessageRead } from '@/app/actions/messages';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface MessageRow {
  id: string;
  subject: string;
  body: string;
  sent_at: string;
  sender_id?: string;
}

interface InboxEntry {
  message_id: string;
  is_read: boolean;
  read_at: string | null;
  message: MessageRow | null;
}

type SentEntry = MessageRow

export function MessagesClient({
  inbox,
  sent,
  users,
}: {
  currentUserId: string;
  inbox: InboxEntry[];
  sent: SentEntry[];
  users: User[];
}) {
  const [tab, setTab] = useState<'inbox' | 'sent'>('inbox');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipientIds, setRecipientIds] = useState<string[]>([]);

  const unreadCount = inbox.filter((i) => !i.is_read).length;

  const list: (MessageRow & { is_read?: boolean })[] = useMemo(() => {
    if (tab === 'inbox') {
      return inbox
        .filter((i) => i.message)
        .map((i) => ({ ...(i.message as MessageRow), is_read: i.is_read }));
    }
    return sent;
  }, [tab, inbox, sent]);

  const selected = list.find((m) => m.id === selectedId) ?? null;

  const onSelect = (id: string) => {
    setSelectedId(id);
    if (tab === 'inbox') {
      const entry = inbox.find((i) => i.message_id === id);
      if (entry && !entry.is_read) {
        startTransition(async () => {
          await markMessageRead(id);
        });
      }
    }
  };

  const reset = () => {
    setSubject('');
    setBody('');
    setRecipientIds([]);
  };

  const submit = () => {
    if (!subject.trim() || !body.trim() || recipientIds.length === 0) {
      toast.error('Subject, message, and at least one recipient required');
      return;
    }
    startTransition(async () => {
      const result = await sendMessage({
        subject,
        body,
        recipient_ids: recipientIds,
      });
      if (result.error) toast.error(result.error);
      else {
        toast.success('Message sent');
        reset();
        setComposeOpen(false);
      }
    });
  };

  return (
    <div className="px-6 md:px-12 py-8">
      <PageHeader
        title="Messages"
        subtitle={`${unreadCount} unread`}
        action={
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
            Compose
          </button>
        }
      />

      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-4">
        <aside className="md:col-span-3 card-premium p-3 h-fit">
          <nav className="space-y-1">
            <button
              type="button"
              onClick={() => {
                setTab('inbox');
                setSelectedId(null);
              }}
              className={`w-full rounded-lg px-3 py-2 text-start text-sm font-medium flex items-center justify-between ${
                tab === 'inbox'
                  ? 'bg-primary-container/15 text-primary'
                  : 'text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px]">
                  inbox
                </span>
                Inbox
              </span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary text-on-primary text-xs font-bold px-2 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('sent');
                setSelectedId(null);
              }}
              className={`w-full rounded-lg px-3 py-2 text-start text-sm font-medium flex items-center gap-2 ${
                tab === 'sent'
                  ? 'bg-primary-container/15 text-primary'
                  : 'text-on-surface hover:bg-surface-container-low'
              }`}
            >
              <span className="material-symbols-outlined text-[18px]">send</span>
              Sent
            </button>
          </nav>
        </aside>

        <section className="md:col-span-4 card-premium overflow-hidden">
          {list.length === 0 ? (
            <EmptyState
              icon="mail"
              title="No messages"
              description={tab === 'inbox' ? 'Inbox is empty' : 'Nothing sent yet'}
            />
          ) : (
            <ul className="divide-y divide-outline-variant/20 max-h-[70vh] overflow-y-auto">
              {list.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(m.id)}
                    className={`w-full px-4 py-3 text-start hover:bg-surface-container-low/50 transition-colors ${
                      selectedId === m.id ? 'bg-primary-container/10' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-sm text-on-surface truncate">
                        {m.subject}
                      </p>
                      {m.is_read === false && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant mt-1">
                      {new Date(m.sent_at).toLocaleString()}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="md:col-span-5 card-premium p-6 min-h-[400px]">
          {selected ? (
            <div>
              <h3 className="font-headline text-xl font-bold text-on-surface mb-1">
                {selected.subject}
              </h3>
              <p className="text-xs text-on-surface-variant mb-6">
                {new Date(selected.sent_at).toLocaleString()}
              </p>
              <div
                className="prose prose-sm max-w-none text-on-surface"
                dangerouslySetInnerHTML={{ __html: selected.body }}
              />
            </div>
          ) : (
            <div className="flex h-full items-center justify-center text-on-surface-variant text-sm">
              Select a message to read
            </div>
          )}
        </section>
      </div>

      <SlideOver
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        title="New message"
        width="lg"
        footer={
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setComposeOpen(false)}
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
              {isPending ? 'Sending…' : 'Send'}
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              To
            </label>
            <select
              multiple
              value={recipientIds}
              onChange={(e) =>
                setRecipientIds(
                  Array.from(e.target.selectedOptions).map((o) => o.value)
                )
              }
              className="!h-auto min-h-[120px]"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.first_name} {u.last_name} ({u.role})
                </option>
              ))}
            </select>
            <p className="text-xs text-on-surface-variant mt-1">
              Hold Cmd/Ctrl to select multiple
            </p>
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Subject
            </label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant mb-1 block">
              Message
            </label>
            <RichTextEditor value={body} onChange={setBody} />
          </div>
        </div>
      </SlideOver>
    </div>
  );
}
