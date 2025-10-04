import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { Shield, FileSearch, FileText, Settings } from 'lucide-react-native';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';

  // Dynamic theme colors
  const tabBarStyle = {
    backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
    borderTopColor: isDarkMode ? '#334155' : '#e2e8f0',
    height: 80,
    paddingBottom: 20,
    paddingTop: 10,
  };

  const tabBarActiveTintColor = isDarkMode ? '#f59e0b' : '#15803d';
  const tabBarInactiveTintColor = '#64748b';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle,
        tabBarActiveTintColor,
        tabBarInactiveTintColor,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ size, color }) => (
            <Shield size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analysis"
        options={{
          title: 'Analysis',
          tabBarIcon: ({ size, color }) => (
            <FileSearch size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Reports',
          tabBarIcon: ({ size, color }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ size, color }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}