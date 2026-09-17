import { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const Icon = MaterialIcons as any;

interface ClassInfo {
  id: string;
  name: string;
  grade_level: string | null;
  studentCount: number;
}

export default function TeacherClassesScreen() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassInfo[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('class_teachers')
        .select('class:classes(id, name, grade_level)')
        .eq('teacher_id', user.id);

      const list = (data ?? []).map((d: any) => d.class).filter(Boolean);
      const enriched: ClassInfo[] = [];

      for (const c of list) {
        const { count } = await supabase
          .from('class_students')
          .select('id', { count: 'exact', head: true })
          .eq('class_id', c.id);
        enriched.push({ ...c, studentCount: count ?? 0 });
      }

      setClasses(enriched);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#002147" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="px-5 pt-6 pb-4">
        <Text className="text-xl font-bold text-slate-900 dark:text-white">My Classes</Text>
        <Text className="text-slate-500 text-sm mt-1">{classes.length} assigned</Text>
      </View>
      <ScrollView className="flex-1 px-5">
        {classes.length === 0 ? (
          <View className="items-center mt-20">
            <Icon name="school" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">No classes assigned</Text>
          </View>
        ) : (
          <View className="gap-y-3 pb-20">
            {classes.map((c) => (
              <View
                key={c.id}
                className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50"
              >
                <Text className="font-semibold text-slate-900 dark:text-white text-base">
                  {c.name}
                </Text>
                <View className="flex-row items-center mt-2 gap-x-4">
                  <View className="flex-row items-center">
                    <Icon name="group" size={14} color="#94a3b8" />
                    <Text className="text-slate-500 text-xs ml-1">
                      {c.studentCount} students
                    </Text>
                  </View>
                  {c.grade_level && (
                    <Text className="text-slate-400 text-xs">{c.grade_level}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
