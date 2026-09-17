import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { supabase } from '../../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const signIn = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Email and password required');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);
    if (error) Alert.alert('Login failed', error.message);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-8"
      >
        <View className="items-center mb-10">
          <View className="w-16 h-16 bg-[#002147] rounded-2xl items-center justify-center mb-4">
            <Text className="text-white text-2xl font-bold">T</Text>
          </View>
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            Tadriss
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            Sign in to your account
          </Text>
        </View>

        <View className="gap-y-4">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
              Email
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="you@school.ma"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              className="h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </View>
          <View>
            <Text className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#94a3b8"
              secureTextEntry
              className="h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
            />
          </View>

          <Pressable
            onPress={signIn}
            disabled={loading}
            className="h-12 bg-[#002147] rounded-xl items-center justify-center mt-2"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            <Text className="text-white font-semibold text-sm">
              {loading ? 'Signing in…' : 'Sign In'}
            </Text>
          </Pressable>

          <Link href="/(auth)/forgot-password" asChild>
            <Pressable className="items-center mt-3">
              <Text className="text-sm text-[#002147] dark:text-slate-400 font-medium">
                Forgot password?
              </Text>
            </Pressable>
          </Link>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
