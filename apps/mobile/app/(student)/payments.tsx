import { useEffect, useState } from 'react';
import { View, Text, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const Icon = MaterialIcons as any;

interface Fee {
  id: string;
  label: string;
  amount: number;
  status: string;
  due_date: string | null;
}

export default function PaymentsScreen() {
  const [loading, setLoading] = useState(true);
  const [fees, setFees] = useState<Fee[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('enrollment_fees')
        .select('id, label, amount, status, due_date')
        .eq('student_id', user.id)
        .order('due_date', { ascending: false });
      setFees((data ?? []) as Fee[]);
      setLoading(false);
    })();
  }, []);

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" color="#002147" />
    </View>
  );

  const unpaid = fees.filter((f) => f.status !== 'paid');
  const paid = fees.filter((f) => f.status === 'paid');
  const totalDue = unpaid.reduce((s, f) => s + f.amount, 0);

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <View className="px-5 pt-6 pb-4">
        <Text className="text-xl font-bold text-slate-900 dark:text-white">Payments</Text>
      </View>

      {totalDue > 0 && (
        <View className="mx-5 mb-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800">
          <Text className="text-orange-800 dark:text-orange-300 font-bold text-sm">
            Outstanding balance
          </Text>
          <Text className="text-orange-900 dark:text-orange-200 font-bold text-2xl mt-1">
            {totalDue.toLocaleString()} MAD
          </Text>
        </View>
      )}

      <ScrollView className="flex-1 px-5">
        {fees.length === 0 ? (
          <View className="items-center mt-20">
            <Icon name="payments" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-3">No fees assigned</Text>
          </View>
        ) : (
          <View className="gap-y-2 pb-20">
            {unpaid.length > 0 && (
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-1">
                Unpaid
              </Text>
            )}
            {unpaid.map((f) => (
              <FeeRow key={f.id} fee={f} />
            ))}
            {paid.length > 0 && (
              <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 mt-4 mb-1">
                Paid
              </Text>
            )}
            {paid.map((f) => (
              <FeeRow key={f.id} fee={f} />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function FeeRow({ fee }: { fee: Fee }) {
  const isPaid = fee.status === 'paid';
  return (
    <View className="flex-row items-center p-3 rounded-xl border border-slate-100 dark:border-slate-800">
      <View
        className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${
          isPaid ? 'bg-green-100' : 'bg-orange-100'
        }`}
      >
        <Icon
          name={isPaid ? 'check-circle' : 'pending'}
          size={18}
          color={isPaid ? '#15803d' : '#ea580c'}
        />
      </View>
      <View className="flex-1">
        <Text className="font-medium text-sm text-slate-900 dark:text-white">
          {fee.label}
        </Text>
        {fee.due_date && (
          <Text className="text-slate-400 text-xs">
            Due {new Date(fee.due_date).toLocaleDateString()}
          </Text>
        )}
      </View>
      <Text className="font-bold text-sm text-slate-900 dark:text-white">
        {fee.amount.toLocaleString()} MAD
      </Text>
    </View>
  );
}
