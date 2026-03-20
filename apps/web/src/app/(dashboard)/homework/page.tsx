'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

type TabFilter = 'all' | 'draft' | 'published' | 'archived';

interface HomeworkItem {
  id: string;
  title: string;
  description: string;
  class_name: string;
  teacher_name: string;
  due_date: string;
  file_url: string | null;
  status: string;
  created_at: string;
}

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'published', label: 'Published' },
  { key: 'archived', label: 'Archived' },
];

export default function HomeworkPage() {
  const [homework, setHomework] = useState<HomeworkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>('all');
  
  // New Homework state
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<{id: string; name: string}[]>([]);
  const [form, setForm] = useState({ title: '', description: '', class_id: '', due_date: '' });
  const [file, setFile] = useState<File | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  
  const supabase = createClient();
  const toast = useToast();

  async function loadHomework() {
    const { data } = await supabase
      .from('homework')
      .select(`
        id, title, description, due_date, file_url, created_at,
        classes(name),
        teacher:profiles!homework_teacher_id_fkey(first_name, last_name)
      `)
      .order('created_at', { ascending: false });

    const mapped = (data ?? []).map((h: any) => ({
      id: h.id,
      title: h.title,
      description: h.description ?? '',
      class_name: h.classes?.name ?? '—',
      teacher_name: h.teacher ? `${h.teacher.first_name} ${h.teacher.last_name}` : '—',
      due_date: h.due_date,
      file_url: h.file_url,
      status: h.file_url ? 'published' : 'draft', // derive status from existing schema
      created_at: h.created_at,
    }));
    setHomework(mapped);
  }

  async function loadTeacherData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    setIsTeacher(user.app_metadata?.role === 'teacher' || user.app_metadata?.role === 'institution_admin');

    if (user.app_metadata?.role === 'teacher') {
      const { data } = await supabase.from('class_teachers')
        .select('classes(id, name)')
        .eq('teacher_id', user.id);
      
      const tc = (data ?? []).map((c: any) => ({
        id: c.classes.id,
        name: c.classes.name
      }));
      setTeacherClasses(tc);
    } else if (user.app_metadata?.role === 'institution_admin') {
       const { data } = await supabase.from('classes').select('id, name');
       setTeacherClasses(data ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { 
    Promise.all([loadHomework(), loadTeacherData()]); 
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!form.class_id) {
      toast.error('Please select a class');
      return;
    }
    setSaving(true);
    try {
      let file_url = null;
      const { data: { user } } = await supabase.auth.getUser();
      const institutionId = user?.app_metadata?.institution_id;
      
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${institutionId}/${form.class_id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('homework')
          .upload(filePath, file);
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('homework')
          .getPublicUrl(filePath);
          
        file_url = publicUrlData.publicUrl;
      }

      const { error } = await supabase.from('homework').insert({
        institution_id: institutionId,
        class_id: form.class_id,
        teacher_id: user?.id,
        title: form.title,
        description: form.description || null,
        due_date: form.due_date || null,
        file_url
      });
      
      if (error) throw error;
      
      toast.success('Homework created successfully');
      setCreateOpen(false);
      setForm({ title: '', description: '', class_id: '', due_date: '' });
      setFile(null);
      loadHomework();
    } catch (err: any) {
      toast.error(err.message || 'Error creating homework');
    }
    setSaving(false);
  }

  const filtered = tab === 'all' ? homework : homework.filter((h) => h.status === tab);

  const statusBadge = (s: string) => {
    switch (s) {
      case 'published': return <Badge variant="success">Published</Badge>;
      case 'archived': return <Badge variant="neutral">Archived</Badge>;
      default: return <Badge variant="warning">Draft</Badge>;
    }
  };

  const columns = [
    {
      key: 'title',
      label: 'Assignment',
      sortable: true,
      render: (row: HomeworkItem) => (
        <div>
          <p className="font-semibold text-slate-900">{row.title}</p>
          {row.description && <p className="text-xs text-slate-500 mt-0.5 truncate max-w-[300px]">{row.description}</p>}
        </div>
      ),
    },
    { key: 'class_name', label: 'Class', sortable: true },
    { key: 'teacher_name', label: 'Teacher', sortable: true },
    {
      key: 'due_date',
      label: 'Due Date',
      sortable: true,
      render: (row: HomeworkItem) => {
        if (!row.due_date) return <span className="text-slate-400">—</span>;
        const due = new Date(row.due_date);
        const isPast = due < new Date();
        return (
          <span className={isPast ? 'text-red-600 font-medium' : 'text-slate-700'}>
            {due.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
          </span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      render: (row: HomeworkItem) => statusBadge(row.status),
    },
    {
      key: 'file',
      label: 'Attachment',
      render: (row: HomeworkItem) => row.file_url ? (
        <a href={row.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline text-sm font-medium">
          <span className="material-symbols-outlined text-base">attach_file</span>
          View File
        </a>
      ) : <span className="text-slate-400">—</span>,
    },
  ];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Homework</h1>
          <p className="text-sm text-slate-500 mt-1">View all assignments across classes</p>
        </div>
        
        {isTeacher && (
          <button onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            New Homework
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-5 bg-slate-100 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t.key
                ? 'bg-white text-primary shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        searchPlaceholder="Search assignments..."
        emptyMessage="No homework assignments found."
      />

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Homework">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Chapter 4 Exercises"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Details about the homework..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Class</label>
              <select required value={form.class_id} onChange={(e) => setForm({ ...form, class_id: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                <option value="">Select Class...</option>
                {teacherClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
              <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Attachment (File/Image)</label>
            <input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20" />
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving || !form.class_id} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Homework'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
