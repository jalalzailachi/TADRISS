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

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const reset = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email required');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (error) Alert.alert('Error', error.message);
    else setSent(true);
  };

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-900">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-center px-8"
      >
        <View className="items-center mb-10">
          <Text className="text-2xl font-bold text-slate-900 dark:text-white">
            Reset password
          </Text>
          <Text className="text-slate-500 dark:text-slate-400 text-sm mt-1 text-center">
            {sent
              ? 'Check your email for a reset link.'
              : "Enter your email and we'll send a reset link."}
          </Text>
        </View>

        {!sent && (
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
                className="h-12 px-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
              />
            </View>

            <Pressable
              onPress={reset}
              disabled={loading}
              className="h-12 bg-[#002147] rounded-xl items-center justify-center mt-2"
              style={{ opacity: loading ? 0.6 : 1 }}
            >
              <Text className="text-white font-semibold text-sm">
                {loading ? 'Sending…' : 'Send reset link'}
              </Text>
            </Pressable>
          </View>
        )}

        <Link href="/(auth)/login" asChild>
          <Pressable className="items-center mt-6">
            <Text className="text-sm text-[#002147] dark:text-slate-400 font-medium">
              Back to login
            </Text>
          </Pressable>
        </Link>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
