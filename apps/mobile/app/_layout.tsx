import '../global.css';
import { Slot } from 'expo-router';
import { View } from 'react-native';

export default function Layout() {
  return (
    <View className="flex-1 bg-background-light dark:bg-background-dark">
      <Slot />
    </View>
  );
}
