/**
 * Tadriss Seed — Auth users + relational data
 * Run: npx tsx supabase/seed-auth.ts
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const INST_ID = '00000000-0000-0000-0000-000000000001';
const PASSWORD = 'Demo@1234';

const CLASS_IDS = [
  '00000000-0000-0000-0001-000000000001',
  '00000000-0000-0000-0001-000000000002',
  '00000000-0000-0000-0001-000000000003',
];

const SUBJECTS = ['Math', 'French', 'Arabic', 'Science', 'History'];

async function createUser(
  email: string,
  firstName: string,
  lastName: string,
  role: string
): Promise<string | null> {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: PASSWORD,
    email_confirm: true,
    app_metadata: { institution_id: INST_ID, role },
  });
  if (error) {
    if (error.message.includes('already been registered')) {
      const { data: existing } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();
      return existing?.id ?? null;
    }
    console.error(`Failed to create ${email}:`, error.message);
    return null;
  }
  const uid = data.user.id;
  await admin.from('profiles').upsert({
    id: uid,
    email,
    first_name: firstName,
    last_name: lastName,
    role,
    institution_id: INST_ID,
    is_active: true,
  });
  return uid;
}

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalRandom(mu: number, sigma: number) {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return Math.round(Math.max(0, Math.min(100, mu + z * sigma)));
}

async function main() {
  console.log('Seeding auth users and data...');

  // Admin
  const adminId = await createUser(
    'admin@excellence.ma',
    'Youssef',
    'Bennani',
    'institution_admin'
  );
  if (!adminId) {
    console.error('Could not create admin — aborting');
    process.exit(1);
  }
  console.log('Admin created:', adminId);

  // Teachers (3)
  const teacherNames = [
    { email: 'fatima.alaoui@excellence.ma', first: 'Fatima', last: 'Alaoui' },
    { email: 'ahmed.idrissi@excellence.ma', first: 'Ahmed', last: 'Idrissi' },
    { email: 'sara.mansouri@excellence.ma', first: 'Sara', last: 'Mansouri' },
  ];
  const teacherIds: string[] = [];
  for (const t of teacherNames) {
    const id = await createUser(t.email, t.first, t.last, 'teacher');
    if (id) teacherIds.push(id);
  }
  console.log(`Created ${teacherIds.length} teachers`);

  // Assign teachers to classes
  for (let i = 0; i < teacherIds.length; i++) {
    await admin.from('class_teachers').upsert(
      { institution_id: INST_ID, class_id: CLASS_IDS[i], teacher_id: teacherIds[i] },
      { onConflict: 'class_id,teacher_id' }
    );
  }

  // Students (15 per class = 45 total)
  const firstNames = [
    'Amine', 'Yassine', 'Imane', 'Hajar', 'Omar',
    'Khadija', 'Mehdi', 'Salma', 'Reda', 'Zineb',
    'Hamza', 'Nadia', 'Mouad', 'Loubna', 'Ayoub',
    'Sanaa', 'Rachid', 'Houda', 'Karim', 'Wafaa',
    'Soufiane', 'Asmaa', 'Badr', 'Ikram', 'Othmane',
    'Ghita', 'Taha', 'Meryem', 'Zakaria', 'Nisrine',
    'Anass', 'Layla', 'Ilyas', 'Rim', 'Bilal',
    'Chaima', 'Younes', 'Siham', 'Adil', 'Fatima-Zahra',
    'Saad', 'Noura', 'Walid', 'Dounia', 'Hicham',
  ];
  const lastNames = [
    'ElAmrani', 'Tazi', 'Berrada', 'Fassi', 'Chraibi',
    'Squalli', 'Benmoussa', 'Kettani', 'Lahlou', 'Zniber',
    'Sefrioui', 'Bennis', 'Hajji', 'Filali', 'Cherkaoui',
  ];

  const allStudentIds: string[] = [];
  const classStudents: Record<string, string[]> = {};

  for (let c = 0; c < 3; c++) {
    classStudents[CLASS_IDS[c]] = [];
    for (let s = 0; s < 15; s++) {
      const idx = c * 15 + s;
      const fn = firstNames[idx % firstNames.length];
      const ln = lastNames[idx % lastNames.length];
      const email = `${fn.toLowerCase()}.${ln.toLowerCase()}${idx}@student.excellence.ma`;
      const id = await createUser(email, fn, ln, 'student');
      if (id) {
        allStudentIds.push(id);
        classStudents[CLASS_IDS[c]].push(id);
      }
    }
  }
  console.log(`Created ${allStudentIds.length} students`);

  // Enroll students
  for (const classId of CLASS_IDS) {
    for (const studentId of classStudents[classId]) {
      await admin.from('class_students').upsert(
        { institution_id: INST_ID, class_id: classId, student_id: studentId },
        { onConflict: 'class_id,student_id' }
      );
    }
  }

  // Attendance — last 30 days, 95% present
  console.log('Generating attendance...');
  const today = new Date();
  const attendanceRows: Array<Record<string, unknown>> = [];
  for (let d = 0; d < 30; d++) {
    const date = new Date(today);
    date.setDate(date.getDate() - d);
    const dow = date.getDay();
    if (dow === 0 || dow === 6) continue; // skip weekends

    const dateStr = date.toISOString().slice(0, 10);
    for (const classId of CLASS_IDS) {
      const teacherIdx = CLASS_IDS.indexOf(classId);
      const tid = teacherIds[teacherIdx] ?? teacherIds[0];
      for (const sid of classStudents[classId]) {
        const status = Math.random() < 0.95 ? 'present' : Math.random() < 0.5 ? 'absent' : 'late';
        attendanceRows.push({
          institution_id: INST_ID,
          class_id: classId,
          student_id: sid,
          date: dateStr,
          status,
          recorded_by: tid,
        });
      }
    }
  }
  // Batch insert
  for (let i = 0; i < attendanceRows.length; i += 500) {
    const batch = attendanceRows.slice(i, i + 500);
    const { error } = await admin.from('attendance').upsert(batch, {
      onConflict: 'class_id,student_id,date',
    });
    if (error) console.error('Attendance batch error:', error.message);
  }
  console.log(`Inserted ${attendanceRows.length} attendance records`);

  // Exams — 2 per subject per class
  console.log('Generating exams and grades...');
  const examIds: string[] = [];
  const examMeta: Array<{ id: string; classId: string; maxScore: number }> = [];

  for (const classId of CLASS_IDS) {
    for (const subject of SUBJECTS) {
      for (let e = 0; e < 2; e++) {
        const examDate = new Date(today);
        examDate.setDate(examDate.getDate() - randomInt(5, 60));
        const { data, error } = await admin
          .from('exams')
          .insert({
            institution_id: INST_ID,
            class_id: classId,
            subject_text: subject,
            academic_term: e === 0 ? 'S1' : 'S2',
            name: `${subject} ${e === 0 ? 'Midterm' : 'Final'}`,
            exam_date: examDate.toISOString().slice(0, 10),
            max_score: 100,
            weight: e === 0 ? 1 : 2,
          })
          .select('id')
          .single();
        if (data) {
          examIds.push(data.id);
          examMeta.push({ id: data.id, classId, maxScore: 100 });
        } else if (error) {
          console.error('Exam insert error:', error.message);
        }
      }
    }
  }
  console.log(`Created ${examIds.length} exams`);

  // Grades
  const gradeRows: Array<Record<string, unknown>> = [];
  for (const exam of examMeta) {
    const students = classStudents[exam.classId] ?? [];
    for (const sid of students) {
      gradeRows.push({
        institution_id: INST_ID,
        exam_id: exam.id,
        student_id: sid,
        score: normalRandom(72, 15),
        graded_by: teacherIds[0],
      });
    }
  }
  for (let i = 0; i < gradeRows.length; i += 500) {
    const batch = gradeRows.slice(i, i + 500);
    const { error } = await admin.from('grades').upsert(batch, {
      onConflict: 'student_id,exam_id',
    });
    if (error) console.error('Grade batch error:', error.message);
  }
  console.log(`Inserted ${gradeRows.length} grades`);

  // Enrollment fees — 5 per student (3 unpaid, 2 paid)
  console.log('Generating fees...');
  const feeLabels = [
    'Tuition - September',
    'Tuition - October',
    'Tuition - November',
    'Registration Fee',
    'Books & Materials',
  ];
  for (const sid of allStudentIds) {
    const classId = CLASS_IDS.find((c) => classStudents[c]?.includes(sid)) ?? CLASS_IDS[0];
    for (let f = 0; f < 5; f++) {
      const amount = f < 3 ? 2500 : f === 3 ? 5000 : 800;
      const isPaid = f >= 3;
      await admin.from('enrollment_fees').insert({
        institution_id: INST_ID,
        student_id: sid,
        class_id: classId,
        label: feeLabels[f],
        amount,
        status: isPaid ? 'paid' : 'unpaid',
        due_date: new Date(2024, 8 + f, 1).toISOString().slice(0, 10),
      });
    }
  }
  console.log(`Inserted ${allStudentIds.length * 5} fees`);

  console.log('\nSeed complete!');
  console.log('Admin login: admin@excellence.ma / Demo@1234');
  console.log('Teacher login: fatima.alaoui@excellence.ma / Demo@1234');
  console.log(`Student login: ${firstNames[0].toLowerCase()}.${lastNames[0].toLowerCase()}0@student.excellence.ma / Demo@1234`);
}

main().catch(console.error);
