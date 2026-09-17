import { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const Icon = MaterialIcons as any;

interface Homework {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  created_at: string;
  class: { name: string } | null;
}

export default function TeacherHomeworkScreen() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Homework[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('homework')
        .select('id, title, description, due_date, created_at, class:classes(name)')
        .eq('assigned_by', user.id)
        .order('created_at', { ascending: false })
        .limit(50);
      setItems((data ?? []) as unknown as Homework[]);
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
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Homework</Text>
        <Text className="text-slate-500 text-sm mt-1">{items.length} assigned</Text>
      </View>
      <ScrollView className="flex-1 px-5">
        {items.length === 0 ? (
          <View className="items-center mt-20">
            <Icon name="assignment" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">No homework assigned yet</Text>
          </View>
        ) : (
          <View className="gap-y-3 pb-20">
            {items.map((h) => {
              const isOverdue =
                h.due_date && new Date(h.due_date) < new Date();
              return (
                <View
                  key={h.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-800"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="font-semibold text-slate-900 dark:text-white">
                        {h.title}
                      </Text>
                      <Text className="text-slate-500 text-xs mt-0.5">
                        {h.class?.name ?? 'No class'}
                      </Text>
                    </View>
                    {h.due_date && (
                      <Text
                        className={`text-xs font-semibold ${
                          isOverdue ? 'text-red-600' : 'text-slate-500'
                        }`}
                      >
                        Due {new Date(h.due_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  {h.description && (
                    <Text className="text-slate-500 text-xs mt-2" numberOfLines={2}>
                      {h.description}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
