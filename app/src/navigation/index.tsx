import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../constants';

// Screens (lazy imports to speed up initial render)
import HomeScreen from '../screens/HomeScreen';
import GridTestScreen from '../screens/GridTestScreen';
import GhostMonitorScreen from '../screens/GhostMonitorScreen';
import HeatmapScreen from '../screens/HeatmapScreen';
import HardwareGuideScreen from '../screens/HardwareGuideScreen';
import HistoryScreen from '../screens/HistoryScreen';
import SessionDetailScreen from '../screens/SessionDetailScreen';

export type RootStackParamList = {
  Main: undefined;
  GridTest: undefined;
  GhostMonitor: undefined;
  Heatmap: { sessionId: string };
  SessionDetail: { sessionId: string };
};

export type MainTabParamList = {
  Home: undefined;
  History: undefined;
  Guide: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          height: 60,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="phone-portrait-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="Guide"
        component={HardwareGuideScreen}
        options={{
          tabBarLabel: 'Repair Guide',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="construct-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function Navigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
        }}
      >
        <Stack.Screen name="Main" component={MainTabs} />
        <Stack.Screen
          name="GridTest"
          component={GridTestScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen
          name="GhostMonitor"
          component={GhostMonitorScreen}
          options={{ presentation: 'fullScreenModal' }}
        />
        <Stack.Screen name="Heatmap" component={HeatmapScreen} />
        <Stack.Screen name="SessionDetail" component={SessionDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
