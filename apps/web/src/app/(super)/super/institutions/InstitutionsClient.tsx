'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { PageHeader } from '@/components/ui/PageHeader';
import { SlideOver } from '@/components/ui/SlideOver';
import { EmptyState } from '@/components/ui/EmptyState';
import {
  createInstitution,
  toggleInstitutionActive,
} from '@/app/actions/super/institutions';

interface Institution {
  id: string;
  name: string;
  city: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  max_students: number | null;
  max_teachers: number | null;
}

export function InstitutionsClient({
  institutions,
}: {
  institutions: Institution[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  const submit = () => {
    if (!name.trim()) {
      toast.error('Name required');
      return;
    }
    startTransition(async () => {
      const res = await createInstitution({
        name,
        city: city || undefined,
        phone: phone || undefined,
      });
      if (res.error) toast.error(res.error);
      else {
        toast.success('Institution created');
        setName('');
        setCity('');
        setPhone('');
        setOpen(false);
      }
    });
  };

  const toggle = (inst: Institution) => {
    const next = !inst.is_active;
    if (!confirm(`${next ? 'Activate' : 'Suspend'} "${inst.name}"?`)) return;
    startTransition(async () => {
      const res = await toggleInstitutionActive(inst.id, next);
      if (res.error) toast.error(res.error);
      else toast.success(next ? 'Activated' : 'Suspended');
    });
  };

  return (
    <>
      <PageHeader
        title="Institutions"
        subtitle={`${institutions.length} total`}
        action={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-on-primary shadow-sm hover:bg-primary-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New institution
          </button>
        }
      />

      <div className="mt-6 card-premium overflow-hidden">
        {institutions.length === 0 ? (
          <EmptyState
            icon="domain"
            title="No institutions"
            description="Create the first institution to get started."
          />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-container-low text-xs uppercase tracking-wider text-on-surface-variant">
              <tr>
                <th className="px-6 py-3 text-start font-semibold">Name</th>
                <th className="px-6 py-3 text-start font-semibold">City</th>
                <th className="px-6 py-3 text-start font-semibold">Status</th>
                <th className="px-6 py-3 text-start font-semibold">Created</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {institutions.map((inst) => (
                <tr key={inst.id} className="hover:bg-surface-container-low/50">
                  <td className="px-6 py-4 font-medium text-on-surface">
                    <Link
                      href={`/super/institutions/${inst.id}`}
                      className="hover:text-primary"
                    >
                      {inst.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-on-surface-variant">
                    {inst.city ?? '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        inst.is_active
                          ? 'bg-success-soft text-on-success-soft'
                          : 'bg-error-soft text-on-error-soft'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          inst.is_active ? 'bg-success' : 'bg-error'
                        }`}
                      />
                      {inst.is_active ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-xs text-on-surface-variant">
                    {new Date(inst.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-end">
                    <button
                      type="button"
                      onClick={() => toggle(inst)}
                      disabled={isPending}
                      className="rounded-lg px-3 py-1.5 text-xs font-semibold border border-outline-variant/40 hover:bg-surface-container-low transition-colors"
                    >
                      {inst.is_active ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title="New institution"
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
              {isPending ? 'Creating…' : 'Create'}
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
              City
            </label>
            <input value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              Phone
            </label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>
      </SlideOver>
    </>
  );
}
