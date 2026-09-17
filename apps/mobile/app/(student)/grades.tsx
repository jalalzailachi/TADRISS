import { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const Icon = MaterialIcons as any;

interface Grade {
  id: string;
  score: number;
  exam: {
    name: string;
    subject_text: string | null;
    max_score: number;
    exam_date: string;
  } | null;
}

function letterFor(pct: number) {
  if (pct >= 90) return 'A+';
  if (pct >= 85) return 'A';
  if (pct >= 80) return 'B+';
  if (pct >= 75) return 'B';
  if (pct >= 70) return 'C+';
  if (pct >= 65) return 'C';
  if (pct >= 60) return 'D';
  return 'F';
}

function gradeColor(pct: number) {
  if (pct >= 80) return 'text-green-600';
  if (pct >= 60) return 'text-orange-600';
  return 'text-red-600';
}

export default function GradesScreen() {
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState<Grade[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('grades')
        .select('id, score, exam:exams(name, subject_text, max_score, exam_date)')
        .eq('student_id', user.id)
        .order('graded_at', { ascending: false });
      setGrades((data ?? []) as unknown as Grade[]);
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
        <Text className="text-xl font-bold text-slate-900 dark:text-white">My Grades</Text>
      </View>
      <ScrollView className="flex-1 px-5">
        {grades.length === 0 ? (
          <View className="items-center mt-20">
            <Icon name="grading" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">No grades yet</Text>
          </View>
        ) : (
          <View className="gap-y-3 pb-20">
            {grades.map((g) => {
              if (!g.exam) return null;
              const pct = (g.score / g.exam.max_score) * 100;
              return (
                <View
                  key={g.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-900 dark:text-white">
                        {g.exam.name}
                      </Text>
                      <Text className="text-slate-500 text-xs mt-0.5">
                        {g.exam.subject_text ?? 'General'} ·{' '}
                        {new Date(g.exam.exam_date).toLocaleDateString()}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-lg font-bold ${gradeColor(pct)}`}>
                        {letterFor(pct)}
                      </Text>
                      <Text className="text-slate-500 text-xs">
                        {g.score}/{g.exam.max_score}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
