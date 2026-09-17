import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const Icon = MaterialIcons as any;

export default function StudentTabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#002147',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
        tabBarStyle: {
          borderTopColor: '#f1f5f9',
          paddingBottom: 8,
          paddingTop: 4,
          height: 60,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Icon name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="classes"
        options={{
          title: 'Classes',
          tabBarIcon: ({ color, size }) => <Icon name="school" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => <Icon name="event-available" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="grades"
        options={{
          title: 'Grades',
          tabBarIcon: ({ color, size }) => <Icon name="grading" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="payments"
        options={{
          title: 'Payments',
          tabBarIcon: ({ color, size }) => <Icon name="payments" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
