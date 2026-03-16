/**
 * Tab Navigation Layout
 *
 * 4 tabs: Coach, Health (Fitness), Plan (Nutrition), Profile
 * Matches the Stitch HTML Dashboard bottom navigator.
 */

import React from 'react';
import { Tabs } from 'expo-router';
import { Platform, View, StyleSheet } from 'react-native';
import { Colors } from '../../src/constants/theme';
import { useColorScheme } from '../../components/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useSubscription } from '../../src/hooks/useSubscription';

// Safe Ad Mob Import
let BannerAd: any = null;
let BannerAdSize: any = null;
let TestIds: any = null;
try {
  const Ads = require('react-native-google-mobile-ads');
  BannerAd = Ads.BannerAd;
  BannerAdSize = Ads.BannerAdSize;
  TestIds = Ads.TestIds;
} catch (e) {
  // Module not found, ads will be skipped
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const isDark = colorScheme === 'dark';
  const { isPremium } = useSubscription();

  const adUnitId = (__DEV__ && TestIds) ? TestIds.BANNER : 'ca-app-pub-xxxxxxxxxxxxxxxx/xxxxxxxxxx';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: isDark ? '#64748b' : '#94a3b8',
          tabBarStyle: {
            backgroundColor: Platform.OS === 'ios'
              ? (isDark ? 'rgba(34, 22, 16, 0.8)' : 'rgba(255, 255, 255, 0.8)')
              : palette.background,
            borderTopColor: isDark ? '#1e293b' : '#e2e8f0',
            borderTopWidth: 1,
            paddingTop: 12,
            paddingBottom: 24,
            paddingHorizontal: 24,
            height: Platform.OS === 'ios' ? 88 : 80,
            ...(Platform.OS === 'ios' && {
              shadowColor: 'transparent',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0,
              shadowRadius: 0,
            }),
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginTop: 4,
          },
          headerStyle: {
            backgroundColor: palette.background,
          },
          headerTitleStyle: {
            fontSize: 17,
            fontWeight: '700',
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
              <MaterialIcons name="chat-bubble" color={color} size={24} />
            ),
            headerTitle: 'BeeFit Coach',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="fitness"
          options={{
            title: 'Health',
            tabBarLabel: 'Health',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="favorite" color={color} size={24} />
            ),
            headerTitle: 'Health',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="nutrition"
          options={{
            title: 'Plan',
            tabBarLabel: 'Plan',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="event-note" color={color} size={24} />
            ),
            headerTitle: 'Plan',
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="person" color={color} size={24} />
            ),
            headerTitle: 'Profile',
            headerShown: false,
          }}
        />
      </Tabs>

      {!isPremium && BannerAd && (
        <View style={styles.adContainer}>
          <BannerAd
            unitId={adUnitId}
            size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
            requestOptions={{
              requestNonPersonalizedAdsOnly: true,
            }}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0,
  },
});
