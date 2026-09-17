import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Pressable,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const Icon = MaterialIcons as any;

interface Student {
  id: string;
  first_name: string;
  last_name: string;
}

interface ClassInfo {
  id: string;
  name: string;
}

type Status = 'present' | 'absent' | 'late';

export default function TeacherAttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [students, setStudents] = useState<Student[]>([]);
  const [statuses, setStatuses] = useState<Record<string, Status>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('class_teachers')
        .select('class:classes(id, name)')
        .eq('teacher_id', user.id);
      const list = (data ?? []).map((d: any) => d.class).filter(Boolean);
      setClasses(list);
      if (list.length > 0) setSelectedClass(list[0].id);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    if (!selectedClass) return;
    (async () => {
      const { data } = await supabase
        .from('class_students')
        .select('student:profiles!class_students_student_id_fkey(id, first_name, last_name)')
        .eq('class_id', selectedClass);
      const list = (data ?? []).map((d: any) => d.student).filter(Boolean);
      setStudents(list);
      const initial: Record<string, Status> = {};
      list.forEach((s: Student) => { initial[s.id] = 'present'; });
      setStatuses(initial);
    })();
  }, [selectedClass]);

  const toggle = (id: string) => {
    setStatuses((prev) => {
      const order: Status[] = ['present', 'absent', 'late'];
      const current = prev[id] ?? 'present';
      const next = order[(order.indexOf(current) + 1) % 3];
      return { ...prev, [id]: next };
    });
  };

  const submit = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setSaving(true);

    const today = new Date().toISOString().slice(0, 10);
    const instId = user.app_metadata?.institution_id;

    const rows = students.map((s) => ({
      institution_id: instId,
      class_id: selectedClass,
      student_id: s.id,
      date: today,
      status: statuses[s.id] ?? 'present',
      recorded_by: user.id,
    }));

    const { error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'class_id,student_id,date' });

    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Done', `Attendance saved for ${rows.length} students`);
  };

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#002147" />
    </View>
  );

  const statusStyles: Record<Status, { bg: string; text: string }> = {
    present: { bg: 'bg-green-100', text: 'text-green-700' },
    absent: { bg: 'bg-red-100', text: 'text-red-700' },
    late: { bg: 'bg-orange-100', text: 'text-orange-700' },
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="px-5 pt-6 pb-4">
        <Text className="text-xl font-bold text-slate-900 dark:text-white">
          Take Attendance
        </Text>
        <Text className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString()}
        </Text>
      </View>

      {classes.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-5 mb-4">
          <View className="flex-row gap-x-2">
            {classes.map((c) => (
              <Pressable
                key={c.id}
                onPress={() => setSelectedClass(c.id)}
                className={`px-4 py-2 rounded-full ${
                  selectedClass === c.id
                    ? 'bg-[#002147]'
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedClass === c.id
                      ? 'text-white'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {c.name}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      )}

      <ScrollView className="flex-1 px-5">
        {students.length === 0 ? (
          <View className="items-center mt-20">
            <Icon name="group" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">No students enrolled</Text>
          </View>
        ) : (
          <View className="gap-y-2 pb-32">
            {students.map((s) => {
              const status = statuses[s.id] ?? 'present';
              const style = statusStyles[status];
              return (
                <Pressable
                  key={s.id}
                  onPress={() => toggle(s.id)}
                  className="flex-row items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <View className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 items-center justify-center mr-3">
                    <Text className="text-xs font-bold text-slate-500">
                      {s.first_name[0]}
                      {s.last_name[0]}
                    </Text>
                  </View>
                  <Text className="flex-1 font-medium text-sm text-slate-900 dark:text-white">
                    {s.first_name} {s.last_name}
                  </Text>
                  <View className={`px-3 py-1 rounded-full ${style.bg}`}>
                    <Text className={`text-xs font-semibold uppercase ${style.text}`}>
                      {status}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      {students.length > 0 && (
        <View className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
          <Pressable
            onPress={submit}
            disabled={saving}
            className="h-12 bg-[#002147] rounded-xl items-center justify-center"
            style={{ opacity: saving ? 0.6 : 1 }}
          >
            <Text className="text-white font-semibold text-sm">
              {saving ? 'Saving…' : 'Save Attendance'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}
