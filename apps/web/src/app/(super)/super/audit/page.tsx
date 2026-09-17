import 'server-only';
import { createAdminClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';

export const metadata: Metadata = {
  title: 'Audit Log | Tadriss Super',
};

interface AuditEntry {
  id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  actor_id: string | null;
  institution_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export default async function AuditPage() {
  const admin = await createAdminClient();

  const { data } = await admin
    .from('audit_log')
    .select('id, action, table_name, record_id, actor_id, institution_id, metadata, created_at')
    .order('created_at', { ascending: false })
    .limit(200);

  const entries = (data ?? []) as AuditEntry[];

  return (
    <>
      <PageHeader title="Audit log" subtitle="Platform-wide activity" />

      <div className="mt-6 card-premium overflow-hidden">
        {entries.length === 0 ? (
          <EmptyState
            icon="history"
            title="No audit entries"
            description="Activity will appear here as actions are performed."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 text-start font-semibold">Time</th>
                <th className="px-6 py-3 text-start font-semibold">Action</th>
                <th className="px-6 py-3 text-start font-semibold">Table</th>
                <th className="px-6 py-3 text-start font-semibold">Record</th>
                <th className="px-6 py-3 text-start font-semibold">Actor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {entries.map((e) => (
                <tr key={e.id} className="hover:bg-surface-container-low/50">
                  <td className="px-6 py-3 text-xs text-on-surface-variant whitespace-nowrap">
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-3 font-medium text-on-surface">
                    {e.action}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-on-surface-variant">
                    {e.table_name ?? '—'}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-on-surface-variant truncate max-w-[120px]">
                    {e.record_id ?? '—'}
                  </td>
                  <td className="px-6 py-3 font-mono text-xs text-on-surface-variant truncate max-w-[120px]">
                    {e.actor_id ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
