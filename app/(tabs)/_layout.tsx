/**
 * Tab Navigation Layout — Apple HIG-Inspired
 *
 * 4 tabs: Home (AI Coach), Fitness, Nutrition, Profile
 * Uses native iOS tab bar styling with subtle colors.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../src/constants/theme';
import { useColorScheme } from '../../components/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        // Apple HIG tab bar styling
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: palette.textSecondary,
        tabBarStyle: {
          backgroundColor: Platform.OS === 'ios'
            ? (isDark ? 'rgba(28,28,30,0.92)' : 'rgba(255,255,255,0.92)')
            : palette.background,
          borderTopColor: palette.separator,
          borderTopWidth: 0.5,
          paddingTop: 4,
          height: Platform.OS === 'ios' ? 88 : 64,
          ...(Platform.OS === 'ios' && {
            // iOS blur effect simulation
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -1 },
            shadowOpacity: isDark ? 0.2 : 0.05,
            shadowRadius: 8,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
          marginTop: 2,
        },
        headerStyle: {
          backgroundColor: palette.background,
        },
        headerTitleStyle: {
          fontSize: 17,
          fontWeight: '600',
          color: palette.text,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Coach',
          tabBarLabel: 'Coach',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="coach" color={color} size={size} />
          ),
          headerTitle: 'BeeFit Coach',
        }}
      />
      <Tabs.Screen
        name="fitness"
        options={{
          title: 'Fitness',
          tabBarLabel: 'Fitness',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="fitness" color={color} size={size} />
          ),
          headerTitle: 'Fitness',
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: 'Nutrition',
          tabBarLabel: 'Nutrition',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="nutrition" color={color} size={size} />
          ),
          headerTitle: 'Nutrition',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="profile" color={color} size={size} />
          ),
          headerTitle: 'Profile',
        }}
      />
    </Tabs>
  );
}

/**
 * Simple emoji-based tab icons.
 * In production, replace with SF Symbols or a custom icon library.
 */
function TabIcon({ name, color, size }: { name: string; color: string; size: number }) {
  const React = require('react');
  const { Text } = require('react-native');

  const icons: Record<string, string> = {
    coach: '🐝',
    fitness: '💪',
    nutrition: '🥗',
    profile: '👤',
  };

  return (
    <Text style={{ fontSize: size - 4, opacity: color === Colors.primary ? 1 : 0.5 }}>
      {icons[name] ?? '●'}
    </Text>
  );
}
