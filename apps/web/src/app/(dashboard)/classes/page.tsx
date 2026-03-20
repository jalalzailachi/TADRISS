'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import Link from 'next/link';

interface ClassItem {
  id: string;
  name: string;
  subject: string;
  level: string;
  is_active: boolean;
  students: { id: string; first_name: string; last_name: string }[];
  teachers: { id: string; first_name: string; last_name: string }[];
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassItem | null>(null);
  const [manageClass, setManageClass] = useState<ClassItem | null>(null);
  const [form, setForm] = useState({ name: '', subject: '', level: '' });
  const [saving, setSaving] = useState(false);
  const [allStudents, setAllStudents] = useState<Profile[]>([]);
  const [allTeachers, setAllTeachers] = useState<Profile[]>([]);
  const [addStudentId, setAddStudentId] = useState('');
  const [addTeacherId, setAddTeacherId] = useState('');
  const [role, setRole] = useState<string>('');
  const supabase = createClient();
  const toast = useToast();

  async function loadClasses() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (profile) setRole(profile.role);
    }
    const { data } = await supabase
      .from('classes')
      .select(`
        *,
        class_students(student_id, profiles:student_id(id, first_name, last_name)),
        class_teachers(teacher_id, profiles:teacher_id(id, first_name, last_name))
      `)
      .order('created_at', { ascending: false });

    const mapped = (data ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      subject: c.subject ?? '',
      level: c.level ?? '',
      is_active: c.is_active,
      students: (c.class_students ?? []).map((cs: any) => cs.profiles).filter(Boolean),
      teachers: (c.class_teachers ?? []).map((ct: any) => ct.profiles).filter(Boolean),
    }));
    setClasses(mapped);
    setLoading(false);
  }

  async function loadProfiles() {
    const [s, t] = await Promise.all([
      supabase.from('profiles').select('id, first_name, last_name').eq('role', 'student').eq('is_active', true),
      supabase.from('profiles').select('id, first_name, last_name').eq('role', 'teacher').eq('is_active', true),
    ]);
    setAllStudents(s.data ?? []);
    setAllTeachers(t.data ?? []);
  }

  useEffect(() => { loadClasses(); loadProfiles(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const institutionId = user?.app_metadata?.institution_id;
      const { error } = await supabase.from('classes').insert({
        institution_id: institutionId, name: form.name, subject: form.subject, level: form.level,
      });
      if (error) throw error;
      toast.success('Class created');
      setCreateOpen(false);
      setForm({ name: '', subject: '', level: '' });
      loadClasses();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editClass) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('classes').update({
        name: form.name, subject: form.subject, level: form.level,
      }).eq('id', editClass.id);
      if (error) throw error;
      toast.success('Class updated');
      setEditClass(null);
      loadClasses();
    } catch (err: any) { toast.error(err.message); }
    setSaving(false);
  }

  function openEdit(cls: ClassItem) {
    setForm({ name: cls.name, subject: cls.subject, level: cls.level });
    setEditClass(cls);
  }

  async function addStudent() {
    if (!manageClass || !addStudentId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('class_students').insert({
        institution_id: user?.app_metadata?.institution_id,
        class_id: manageClass.id,
        student_id: addStudentId,
      });
      if (error) throw error;
      toast.success('Student added to class');
      setAddStudentId('');
      loadClasses();
      // Refresh manageClass
      const updated = classes.find(c => c.id === manageClass.id);
      if (updated) setManageClass({ ...updated });
    } catch (err: any) { toast.error(err.message); }
  }

  async function removeStudent(studentId: string) {
    if (!manageClass) return;
    await supabase.from('class_students').delete()
      .eq('class_id', manageClass.id).eq('student_id', studentId);
    toast.success('Student removed');
    loadClasses();
  }

  async function addTeacher() {
    if (!manageClass || !addTeacherId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('class_teachers').insert({
        institution_id: user?.app_metadata?.institution_id,
        class_id: manageClass.id,
        teacher_id: addTeacherId,
      });
      if (error) throw error;
      toast.success('Teacher added to class');
      setAddTeacherId('');
      loadClasses();
    } catch (err: any) { toast.error(err.message); }
  }

  async function removeTeacher(teacherId: string) {
    if (!manageClass) return;
    await supabase.from('class_teachers').delete()
      .eq('class_id', manageClass.id).eq('teacher_id', teacherId);
    toast.success('Teacher removed');
    loadClasses();
  }

  // Keep manageClass in sync with loaded classes
  useEffect(() => {
    if (manageClass) {
      const updated = classes.find(c => c.id === manageClass.id);
      if (updated) setManageClass(updated);
    }
  }, [classes]);

  // Available students/teachers not yet in this class
  const availableStudents = manageClass
    ? allStudents.filter(s => !manageClass.students.some(cs => cs.id === s.id))
    : [];
  const availableTeachers = manageClass
    ? allTeachers.filter(t => !manageClass.teachers.some(ct => ct.id === t.id))
    : [];

  if (loading) return <div className="flex items-center justify-center h-64 text-slate-400">Loading...</div>;

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Classes</h1>
          <p className="text-sm text-slate-500 mt-1">Manage classes, students, and teacher assignments</p>
        </div>
        {role === 'institution_admin' && (
          <button onClick={() => { setForm({ name: '', subject: '', level: '' }); setCreateOpen(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary-hover transition-colors">
            <span className="material-symbols-outlined text-lg">add</span>
            New Class
          </button>
        )}
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
          <span className="material-symbols-outlined text-4xl text-slate-300 mb-3 block">class</span>
          <p className="text-slate-500">No classes yet. Create your first class.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {classes.map((cls) => (
            <div key={cls.id} className="group relative">
              <Link href={`/classes/${cls.id}`} className="block bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition-shadow h-full">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-2.5 bg-purple-50 rounded-lg text-purple-600">
                    <span className="material-symbols-outlined">class</span>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1 group-hover:text-primary transition-colors">{cls.name}</h3>
                <p className="text-sm text-slate-500 mb-1">{cls.subject || 'No subject'}</p>
                {cls.level && <Badge variant="info">{cls.level}</Badge>}
                <div className="flex items-center gap-4 text-sm text-slate-600 mt-4 pt-4 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">school</span>
                    {cls.students.length} students
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-base">person</span>
                    {cls.teachers.length} teachers
                  </span>
                </div>
              </Link>
              
              <div className="absolute top-6 right-6 flex items-center gap-1">
                {role === 'institution_admin' && (
                  <>
                    <button onClick={() => openEdit(cls)} className="p-1 text-slate-400 hover:text-primary transition-colors bg-white/80 rounded" title="Edit">
                      <span className="material-symbols-outlined text-lg">edit</span>
                    </button>
                    <button onClick={() => setManageClass(cls)} className="p-1 text-slate-400 hover:text-primary transition-colors bg-white/80 rounded" title="Manage">
                      <span className="material-symbols-outlined text-lg">group</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Class">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. CP1 Primaire"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="e.g. Mathematics"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
            <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} placeholder="e.g. Grade 6"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setCreateOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50">
              {saving ? 'Creating...' : 'Create Class'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editClass} onClose={() => setEditClass(null)} title="Edit Class">
        <form onSubmit={handleEdit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Class Name</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Level</label>
            <input value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setEditClass(null)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-hover disabled:opacity-50">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Students & Teachers Modal */}
      <Modal open={!!manageClass} onClose={() => setManageClass(null)} title={manageClass ? `Manage: ${manageClass.name}` : ''} size="lg">
        {manageClass && (
          <div className="space-y-6">
            {/* Teachers Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">person</span>
                Teachers ({manageClass.teachers.length})
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <select value={addTeacherId} onChange={(e) => setAddTeacherId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select teacher to add...</option>
                  {availableTeachers.map((t) => <option key={t.id} value={t.id}>{t.first_name} {t.last_name}</option>)}
                </select>
                <button onClick={addTeacher} disabled={!addTeacherId}
                  className="px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover disabled:opacity-40">
                  Add
                </button>
              </div>
              {manageClass.teachers.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No teachers assigned yet.</p>
              ) : (
                <div className="space-y-2">
                  {manageClass.teachers.map((t) => (
                    <div key={t.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-xs font-bold">
                          {t.first_name[0]}{t.last_name[0]}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{t.first_name} {t.last_name}</span>
                      </div>
                      <button onClick={() => removeTeacher(t.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <hr className="border-slate-100" />

            {/* Students Section */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <span className="material-symbols-outlined text-base">school</span>
                Students ({manageClass.students.length})
              </h3>
              <div className="flex items-center gap-2 mb-3">
                <select value={addStudentId} onChange={(e) => setAddStudentId(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
                  <option value="">Select student to add...</option>
                  {availableStudents.map((s) => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
                </select>
                <button onClick={addStudent} disabled={!addStudentId}
                  className="px-3 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary-hover disabled:opacity-40">
                  Add
                </button>
              </div>
              {manageClass.students.length === 0 ? (
                <p className="text-sm text-slate-400 py-2">No students enrolled yet.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {manageClass.students.map((s) => (
                    <div key={s.id} className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <span className="text-sm font-medium text-slate-700">{s.first_name} {s.last_name}</span>
                      </div>
                      <button onClick={() => removeStudent(s.id)} className="text-xs text-red-500 hover:text-red-700 font-medium">Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
