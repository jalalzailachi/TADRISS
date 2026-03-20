import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, SafeAreaView, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function StudentDashboard() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState({ attendance: 0, homework: 0 });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*, class_students(class:classes(*))')
        .eq('id', user.id)
        .single();
      
      setProfile(profileData);

      // Fetch attendance
      const { data: attendance } = await supabase
        .from('attendance_records')
        .select('status')
        .eq('student_id', user.id);
      
      if (attendance && attendance.length > 0) {
        const present = attendance.filter(r => r.status === 'present' || r.status === 'late').length;
        setStats(prev => ({ ...prev, attendance: Math.round((present / attendance.length) * 100) }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-background-dark">
      <ActivityIndicator size="large" color="#002147" />
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-background-dark">
      <ScrollView className="flex-1 bg-white dark:bg-background-dark">
        {/* Header */}
        <View className="flex-row items-center border-b border-slate-100 dark:border-slate-800 p-4 justify-between bg-white dark:bg-background-dark">
          <View className="flex-row items-center flex-1">
            <View className="bg-primary/10 items-center justify-center rounded-lg h-10 w-10">
              <MaterialIcons name="school" size={24} color="#002147" />
            </View>
            <Text className="text-primary dark:text-slate-100 text-lg font-bold leading-tight ml-3">Tadriss</Text>
          </View>
          <View className="flex-row items-center justify-end">
            <Pressable onPress={() => supabase.auth.signOut()} className="items-center justify-center rounded-full h-10 w-10 bg-slate-50 dark:bg-slate-800">
              <MaterialIcons name="logout" size={20} color="#002147" />
            </Pressable>
          </View>
        </View>

        {/* Profile Section */}
        <View className="p-5 flex-row items-center bg-white dark:bg-background-dark">
          <View className="h-20 w-20 rounded-xl bg-slate-200 dark:bg-slate-700 items-center justify-center">
             <Text className="text-2xl font-bold text-slate-400">{profile?.first_name?.[0]}{profile?.last_name?.[0]}</Text>
          </View>
          <View className="ml-4 justify-center">
            <Text className="text-primary dark:text-slate-100 text-xl font-bold leading-tight">
              {profile?.first_name} {profile?.last_name}
            </Text>
            <Text className="text-slate-500 dark:text-slate-400 text-sm font-medium mt-1">
              {profile?.class_students?.[0]?.class?.name || 'No Class Assigned'}
            </Text>
            <View className="flex-row items-center mt-1">
              <Text className="text-slate-400 dark:text-slate-500 text-xs">Student ID: {profile?.id?.substring(0, 8)}</Text>
            </View>
          </View>
        </View>

        {/* Stats Cards */}
        <View className="flex-row px-5 pb-5">
          <View className="flex-1 rounded-xl p-4 bg-primary shadow-sm mr-2">
            <View className="flex-row justify-between items-start">
              <Text className="text-white/80 text-xs font-medium uppercase tracking-wider">Attendance</Text>
              <MaterialIcons name="event-available" size={18} color="rgba(255,255,255,0.6)" />
            </View>
            <View className="flex-row items-baseline mt-2">
              <Text className="text-white text-2xl font-bold leading-tight mr-2">{stats.attendance}%</Text>
              <Text className="text-green-300 text-xs font-bold">Live</Text>
            </View>
          </View>

          <View className="flex-1 rounded-xl p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm ml-2">
            <View className="flex-row justify-between items-start">
              <Text className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider">My Classes</Text>
              <MaterialIcons name="edit-note" size={20} color="rgba(0,33,71,0.4)" />
            </View>
            <View className="flex-row items-baseline mt-2">
              <Text className="text-primary dark:text-slate-100 text-2xl font-bold leading-tight mr-2">
                {profile?.class_students?.length || 0}
              </Text>
              <Text className="text-slate-500 dark:text-slate-400 text-xs">Enrolled</Text>
            </View>
          </View>
        </View>

        {/* Payment Status Banner */}
        <View className="px-5 pb-5">
          <View className="flex-row items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800 bg-primary/5 dark:bg-primary/20 p-4">
            <View className="flex-row items-center flex-1">
              <View className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full mr-3">
                <MaterialIcons name="check-circle" size={20} color="#15803d" />
              </View>
              <View className="flex-1">
                <Text className="text-primary dark:text-slate-100 text-sm font-bold leading-tight">System Status</Text>
                <Text className="text-slate-600 dark:text-slate-400 text-xs mt-1">Mobile dashboard connected</Text>
              </View>
            </View>
            <Pressable onPress={loadData} className="flex-row items-center">
              <Text className="text-xs font-bold text-primary dark:text-slate-100 mr-1">Update</Text>
              <MaterialIcons name="refresh" size={14} color="#002147" />
            </Pressable>
          </View>
        </View>

        {/* Classes List */}
        <View className="px-5 pb-24">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-primary dark:text-slate-100 font-bold text-base">My Classes</Text>
          </View>

          <View className="gap-y-3">
            {profile?.class_students?.map((cs: any) => (
              <View key={cs.class.id} className="flex-row items-center p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/50">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-slate-50 dark:bg-slate-800 mr-3">
                  <MaterialIcons name="class" size={20} color="#94a3b8" />
                </View>
                <View className="flex-1">
                  <Text className="text-slate-900 dark:text-slate-100 font-semibold text-sm">{cs.class.name}</Text>
                  <Text className="text-slate-400 text-xs mt-0.5">Active Enrollment</Text>
                </View>
                <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
              </View>
            )) || (
              <Text className="text-slate-400 text-center italic mt-4">No classes assigned yet.</Text>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navbar (Absolute) */}
      <View className="absolute bottom-0 left-0 right-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-background-dark/95 flex-row px-4 pb-8 pt-3 justify-between">
        <Pressable className="flex-1 items-center justify-end">
          <MaterialIcons name="home" size={28} color="#002147" />
          <Text className="text-primary dark:text-slate-100 text-[10px] font-bold uppercase mt-1">Home</Text>
        </Pressable>
        <Pressable className="flex-1 items-center justify-end">
          <MaterialIcons name="calendar-today" size={24} color="#94a3b8" />
          <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase mt-1">Classes</Text>
        </Pressable>
        <Pressable className="flex-1 items-center justify-end">
          <MaterialIcons name="task-alt" size={24} color="#94a3b8" />
          <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase mt-1">Homework</Text>
        </Pressable>
        <Pressable className="flex-1 items-center justify-end">
          <MaterialIcons name="person" size={24} color="#94a3b8" />
          <Text className="text-slate-400 dark:text-slate-500 text-[10px] font-bold uppercase mt-1">Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
