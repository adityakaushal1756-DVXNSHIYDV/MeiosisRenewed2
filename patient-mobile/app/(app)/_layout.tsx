import { Tabs, Redirect } from 'expo-router';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { Colors, Radius, Spacing } from '../../lib/theme';
import { ActivityIndicator } from 'react-native';

type TabIconProps = {
  name: React.ComponentProps<typeof Feather>['name'];
  color: string;
  label: string;
  focused: boolean;
};

function TabIcon({ name, color, label, focused }: TabIconProps) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemFocused]}>
      <Feather name={name} size={20} color={color} />
      <Text style={[styles.tabLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function AppLayout() {
  const { session, isLoading } = useAuth();
  const insets = useSafeAreaInsets();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.ink, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.neon} size="large" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.panel,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: Colors.neon,
        tabBarInactiveTintColor: Colors.mist,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="prescriptions"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="file-text" color={color} label="Scripts" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="calendar" color={color} label="Visits" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="medicines"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="activity" color={color} label="Meds" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="myqr"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="grid" color={color} label="My QR" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="users" color={color} label="Network" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="settings" color={color} label="Settings" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    gap: 3,
  },
  tabItemFocused: {},
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
});
