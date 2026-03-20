import { View, Text, ScrollView, Image, Pressable, SafeAreaView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

export default function TeacherDashboard() {
  return (
    <SafeAreaView className="flex-1 bg-white dark:bg-slate-950">
      {/* Header */}
      <View className="flex-row items-center justify-between border-b border-primary/10 dark:border-slate-800 px-4 py-3 bg-white dark:bg-slate-900 border-b">
        <View className="flex-row items-center">
          <View className="h-10 w-10 rounded-lg bg-primary items-center justify-center">
            <MaterialIcons name="school" size={24} color="white" />
          </View>
          <View className="ml-3">
            <Text className="text-lg font-bold text-primary dark:text-slate-100">Tadriss</Text>
            <Text className="text-xs text-slate-500 font-medium">Teacher Portal</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <Pressable className="p-2 rounded-full justify-center items-center">
            <MaterialIcons name="notifications" size={24} color="#475569" />
          </Pressable>
          <View className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 overflow-hidden ml-2">
            <Image 
              source={{ uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBQr3rhEb9Q1FrABYs0DjZt2heopQIaTclnPUlmKnxaFMiuFG_2IM0euY4y2n-zg47veRvWkF-MrybKnp54s3vuK2DFCUCKYi4MiH2dzHj_nWvSa4Kwz74_NKuCS4YIOuqoWRqnIJtgXc8l4UQ8V26k2EAVyKcSWK267cTREfo_GqqbeeGxx5IDAC1bhUJZWZw-b-KSQJUTpJgSmgvLGvT49Abx4IRJQK4gTcgwpJwd-OJzWeubd2pXhru3-ad1pdVsB-viHMs1ayfo" }} 
              className="w-full h-full"
            />
          </View>
        </View>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Welcome Section */}
        <View className="mb-8">
          <View className="flex-row items-end justify-between mb-2">
            <View>
              <Text className="text-2xl font-bold text-slate-900 dark:text-white">Welcome,</Text>
              <Text className="text-xl font-medium text-primary dark:text-primary/80">Mr. Anderson</Text>
            </View>
            <View className="items-end">
              <Text className="text-sm font-semibold text-slate-500">Monday</Text>
              <Text className="text-sm text-slate-400">Oct 23, 2023</Text>
            </View>
          </View>

          <View className="mt-4 p-4 rounded-xl bg-primary flex-row items-center justify-between">
            <View>
              <Text className="text-xs text-white/80 uppercase font-bold tracking-wider">Current Status</Text>
              <Text className="text-lg font-semibold text-white mt-1">Next class in 15 mins</Text>
            </View>
            <MaterialIcons name="schedule" size={32} color="rgba(255,255,255,0.5)" />
          </View>
        </View>

        {/* Today's Classes */}
        <View className="mb-8">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-slate-800 dark:text-slate-200">Today's Classes</Text>
            <Pressable>
              <Text className="text-primary dark:text-primary/80 text-sm font-semibold">View Schedule</Text>
            </Pressable>
          </View>

          <View className="gap-y-4">
            {/* Class Card 1 - Active/Next */}
            <View className="bg-white dark:bg-slate-900 border-l-4 border-l-primary rounded-lg p-4 shadow-sm border border-primary/5">
              <View className="flex-row justify-between items-start mb-3">
                <View>
                  <Text className="text-xs font-bold text-primary dark:text-primary/60 uppercase">Room 302</Text>
                  <Text className="text-base font-bold text-slate-900 dark:text-white mt-1">Advanced Algebra</Text>
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="schedule" size={14} color="#64748b" />
                    <Text className="text-sm text-slate-500 ml-1">09:00 AM - 10:30 AM</Text>
                  </View>
                </View>
                <View className="bg-green-100 px-2 py-1 rounded">
                  <Text className="text-green-700 text-[10px] font-bold uppercase">Coming Up</Text>
                </View>
              </View>

              <View className="flex-row mt-4 gap-2">
                <Pressable className="flex-1 bg-primary py-2 rounded-lg flex-row items-center justify-center">
                  <MaterialIcons name="assignment-turned-in" size={16} color="white" />
                  <Text className="text-white text-sm font-bold ml-2">Take Attendance</Text>
                </Pressable>
                <Pressable className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg justify-center items-center ml-2">
                  <MaterialIcons name="more-horiz" size={20} color="#64748b" />
                </Pressable>
              </View>
            </View>

            {/* Class Card 2 */}
            <View className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-xs font-bold text-slate-400 uppercase">Room 105</Text>
                  <Text className="text-base font-bold text-slate-900 dark:text-white mt-1">Geometry II</Text>
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="schedule" size={14} color="#94a3b8" />
                    <Text className="text-sm text-slate-500 ml-1">11:00 AM - 12:30 PM</Text>
                  </View>
                </View>
              </View>

              <View className="flex-row mt-4">
                <Pressable className="flex-1 bg-primary/10 dark:bg-primary/20 py-2 rounded-lg items-center justify-center">
                  <Text className="text-primary dark:text-primary-100 text-sm font-bold">View Materials</Text>
                </Pressable>
              </View>
            </View>

            {/* Class Card 3 */}
            <View className="bg-white dark:bg-slate-900 rounded-lg p-4 shadow-sm border border-slate-100 dark:border-slate-800">
              <View className="flex-row justify-between items-start mb-2">
                <View>
                  <Text className="text-xs font-bold text-slate-400 uppercase">Lab B</Text>
                  <Text className="text-base font-bold text-slate-900 dark:text-white mt-1">Calculus Prep</Text>
                  <View className="flex-row items-center mt-1">
                    <MaterialIcons name="schedule" size={14} color="#94a3b8" />
                    <Text className="text-sm text-slate-500 ml-1">02:00 PM - 03:30 PM</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Management Actions */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Management</Text>
          <View className="flex-row flex-wrap justify-between">
            <Pressable className="w-[48%] items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm mb-4">
              <View className="h-12 w-12 rounded-full bg-blue-50 dark:bg-blue-900/30 items-center justify-center mb-3">
                <MaterialIcons name="edit-note" size={24} color="#2563eb" />
              </View>
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Homework</Text>
            </Pressable>

            <Pressable className="w-[48%] items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm mb-4">
              <View className="h-12 w-12 rounded-full bg-orange-50 dark:bg-orange-900/30 items-center justify-center mb-3">
                <MaterialIcons name="grade" size={24} color="#ea580c" />
              </View>
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Post Grades</Text>
            </Pressable>

            <Pressable className="w-[48%] items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm mb-4">
              <View className="h-12 w-12 rounded-full bg-purple-50 dark:bg-purple-900/30 items-center justify-center mb-3">
                <MaterialIcons name="groups" size={24} color="#9333ea" />
              </View>
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">My Students</Text>
            </Pressable>

            <Pressable className="w-[48%] items-center justify-center p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-sm mb-4">
              <View className="h-12 w-12 rounded-full bg-green-50 dark:bg-green-900/30 items-center justify-center mb-3">
                <MaterialIcons name="mail" size={24} color="#16a34a" />
              </View>
              <Text className="text-sm font-bold text-slate-700 dark:text-slate-300">Messages</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <View className="absolute flex-row border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950 bottom-0 left-0 right-0 px-4 pb-8 pt-3 justify-between items-center">
        <Pressable className="flex-col items-center flex-1">
          <MaterialIcons name="home" size={28} color="#002147" />
          <Text className="text-[10px] font-bold uppercase text-primary mt-1">Home</Text>
        </Pressable>
        <Pressable className="flex-col items-center flex-1">
          <MaterialIcons name="calendar-today" size={24} color="#94a3b8" />
          <Text className="text-[10px] font-bold uppercase text-slate-400 mt-1">Schedule</Text>
        </Pressable>
        <Pressable className="flex-col items-center flex-1">
          <MaterialIcons name="menu-book" size={24} color="#94a3b8" />
          <Text className="text-[10px] font-bold uppercase text-slate-400 mt-1">Homework</Text>
        </Pressable>
        <Pressable className="flex-col items-center flex-1">
          <MaterialIcons name="person" size={24} color="#94a3b8" />
          <Text className="text-[10px] font-bold uppercase text-slate-400 mt-1">Profile</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
