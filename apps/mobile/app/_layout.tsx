import '../global.css';
import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';
import type { Session } from '@supabase/supabase-js';

export default function RootLayout() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [role, setRole] = useState<string | null>(null);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s) setRole(s.user.app_metadata?.role ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) setRole(s.user.app_metadata?.role ?? null);
      else setRole(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return;

    const inAuth = segments[0] === '(auth)';

    if (!session && !inAuth) {
      router.replace('/(auth)/login');
    } else if (session && inAuth) {
      if (role === 'teacher') router.replace('/(teacher)/');
      else router.replace('/(student)/');
    }
  }, [session, segments, role]);

  if (session === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-slate-900">
        <ActivityIndicator size="large" color="#002147" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <Slot />
    </View>
  );
}
