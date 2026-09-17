import { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const Icon = MaterialIcons as any;

interface AttendanceRow {
  id: string;
  date: string;
  status: string;
  class_id: string;
}

const STATUS_COLORS: { [key: string]: { bg: string; text: string; icon: string } } = {
  present: { bg: 'bg-green-50', text: 'text-green-700', icon: 'check-circle' },
  absent: { bg: 'bg-red-50', text: 'text-red-700', icon: 'cancel' },
  late: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'schedule' },
};

export default function AttendanceScreen() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [rate, setRate] = useState(0);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('attendance')
        .select('id, date, status, class_id')
        .eq('student_id', user.id)
        .order('date', { ascending: false })
        .limit(60);
      const list = (data ?? []) as AttendanceRow[];
      setRecords(list);
      if (list.length > 0) {
        const present = list.filter((r) => r.status === 'present' || r.status === 'late').length;
        setRate(Math.round((present / list.length) * 100));
      }
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
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Attendance</Text>
        <Text className="text-slate-500 text-sm mt-1">Rate: {rate}%</Text>
      </View>
      <ScrollView className="flex-1 px-5">
        {records.length === 0 ? (
          <View className="items-center mt-20">
            <Icon name="event-note" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">No records yet</Text>
          </View>
        ) : (
          <View className="gap-y-2 pb-20">
            {records.map((r) => {
              const s = STATUS_COLORS[r.status] ?? STATUS_COLORS.present;
              return (
                <View
                  key={r.id}
                  className={`flex-row items-center p-3 rounded-xl ${s.bg}`}
                >
                  <Icon name={s.icon} size={20} color={s.text.replace('text-', '')} />
                  <Text className={`flex-1 ml-3 font-medium text-sm ${s.text}`}>
                    {new Date(r.date).toLocaleDateString()}
                  </Text>
                  <Text className={`text-xs font-semibold uppercase ${s.text}`}>
                    {r.status}
                  </Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
