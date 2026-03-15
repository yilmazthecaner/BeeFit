/**
 * Home Background / Coach Screen / Dashboard
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '../../src/constants/theme';
import { useColorScheme } from '../../components/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useNutritionStore } from '../../src/stores/useNutritionStore';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const router = useRouter();

  const { user } = useAuthStore();
  const userName = user?.email ? user.email.split('@')[0] : 'Alex';
  const { getDailyTotals } = useNutritionStore();
  const dailyTotals = getDailyTotals();

  // Header matching Stitch exactly
  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.profileImageContainer}>
        <Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ3R4qJ6JDGoygMvbQ0Ywr46v22ed51uYIUXUGa1bfZn5sy6Y9ogNcZpaLqUETxcNkxTHOJjWAMrFE_9Xs83o7yQ6R2xOjOEV2jd8N68MvKq_cDf6pSjGD0ZBg541flkDSvGGO919WH93epEiIrrbHttc51YmRY-b_EZDHBQx11YNllzK0efPHfPYLN6gVFYkn6-L-X5rdq9ndTbmnoCsXnGcRYLWOYtlIDqGA52BPqKYNTQA9D0GsvuRtRxGw9hsJUJflA5i_anhq' }}
          style={styles.profileImage}
        />
      </View>
      <View style={styles.headerCenter}>
        <Text style={styles.headerSubtitle}>TODAY</Text>
        <TouchableOpacity 
          style={styles.headerTitleRow}
          onPress={() => (router.push as any)('/coach-chat')}
        >
          <MaterialIcons name="auto-awesome" size={14} color="#ec5b13" />
          <Text style={styles.headerTitleText}>The Brain</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity style={styles.settingsButton}>
          <MaterialIcons name="settings" size={24} color="#ec5b13" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>Good morning, {userName}.</Text>
          <Text style={styles.greetingText}>
            "You've recovered exceptionally well. Your heart rate variability is up 15%, suggesting today is perfect for a high-intensity session."
          </Text>
        </View>

        <View style={styles.activityGrid}>
          {/* Move Card */}
          <ActivityCard 
            label="Move" 
            value={Math.max(450, dailyTotals.calories)} 
            target={600}
            unit="kcal" 
            color="#ec5b13" 
            icon="local-fire-department" 
            isDark={isDark}
            styles={styles}
          />
          {/* Exercise Card */}
          <ActivityCard 
            label="Exercise" 
            value={22} 
            target={30} 
            unit="min" 
            color="#10b981" 
            icon="fitness-center" 
            isDark={isDark}
            styles={styles}
          />
          {/* Stand Card */}
          <ActivityCard 
            label="Stand" 
            value={8} 
            target={12} 
            unit="hr" 
            color="#0ea5e9" 
            icon="accessibility-new" 
            isDark={isDark}
            styles={styles}
          />
        </View>

        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsTitle}>Proactive Insights</Text>
            <TouchableOpacity>
              <Text style={styles.insightsLink}>View History</Text>
            </TouchableOpacity>
          </View>

          {/* Insight Card 1 */}
          <View style={styles.insightCard1}>
            <View style={styles.insightIcon1Container}>
              <MaterialIcons name="restaurant" size={24} color="#ffffff" />
            </View>
            <View style={styles.insightContent}>
              <View style={styles.insightTitleRow}>
                <Text style={styles.insightTitle1}>Protein intake is low</Text>
                <View style={styles.badgeCritical}>
                  <Text style={styles.badgeCriticalText}>CRITICAL</Text>
                </View>
              </View>
              <Text style={styles.insightBody1}>
                You're currently 45g short of your daily target. Consuming protein in your next meal will help maintain the muscle recovery from yesterday's heavy session.
              </Text>
              <View style={styles.insightActions}>
                <TouchableOpacity style={styles.btnPrimary}>
                  <Text style={styles.btnPrimaryText}>Log Meal</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSecondary}>
                  <Text style={styles.btnSecondaryText}>Dismiss</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Insight Card 2 */}
          <View style={styles.insightCard2}>
            <View style={styles.insightIcon2Container}>
              <MaterialIcons name="bedtime" size={24} color="#ffffff" />
            </View>
            <View style={styles.insightContent}>
              <Text style={styles.insightTitle2}>Optimizing Wind-down</Text>
              <Text style={styles.insightBody2}>
                Based on your high activity, start your wind-down at 9:15 PM tonight to hit your 8-hour sleep goal.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityCard({ label, value, target, unit, color, icon, isDark, styles }: any) {
  const percentage = Math.min(Math.round((value / target) * 100), 100);
  const radius = 40;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <View style={styles.activityCard}>
      <View style={styles.cardRingContainer}>
        <Svg width="128" height="128" viewBox="0 0 100 100" style={styles.svgRing}>
          {/* Background Circle */}
          <Circle
            cx="50"
            cy="50"
            r={radius}
            stroke={color}
            strokeOpacity={0.1}
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress Circle */}
          <Circle
            cx="50"
            cy="50"
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </Svg>
        <View style={styles.cardRingOverlay}>
          <MaterialIcons name={icon} size={28} color={color} style={{marginBottom: 4}} />
          <Text style={styles.cardRingPercent}>{percentage}%</Text>
        </View>
      </View>
      <View style={styles.cardTextContainer}>
        <Text style={styles.cardLabel}>{label}</Text>
        <Text style={styles.cardValue}>
          {value} / {target} <Text style={styles.cardUnit}>{unit}</Text>
        </Text>
      </View>
    </View>
  );
}

const createStyles = (isDark: boolean) => {
  const bgMain = isDark ? '#221610' : '#f8f6f6';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b'; // slate-400 / slate-500
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bgMain,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(236, 91, 19, 0.1)',
      backgroundColor: isDark ? 'rgba(34, 22, 16, 0.8)' : 'rgba(248, 246, 246, 0.8)',
    },
    profileImageContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: 'rgba(236, 91, 19, 0.2)',
    },
    profileImage: {
      width: '100%',
      height: '100%',
    },
    headerCenter: {
      alignItems: 'center',
    },
    headerSubtitle: {
      fontSize: 14,
      fontWeight: '700',
      color: textMain,
      opacity: 0.5,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    headerTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    headerTitleText: {
      fontSize: 16,
      fontWeight: '700',
      color: textMain,
    },
    headerRight: {
      width: 40,
      alignItems: 'flex-end',
    },
    settingsButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: 'rgba(236, 91, 19, 0.1)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    scrollView: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 96,
      paddingHorizontal: 16,
    },
    greetingSection: {
      paddingVertical: 32,
      alignItems: 'center',
      maxWidth: 600,
      alignSelf: 'center',
    },
    greetingTitle: {
      fontSize: 30,
      fontWeight: '700',
      color: textMain,
      marginBottom: 12,
      textAlign: 'center',
      letterSpacing: -0.5,
    },
    greetingText: {
      fontSize: 18,
      fontWeight: '500',
      color: textMuted,
      lineHeight: 28,
      textAlign: 'center',
    },
    activityGrid: {
      flexDirection: 'column',
      gap: 16,
      marginBottom: 32,
    },
    activityCard: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
      backgroundColor: cardBg,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: borderColor,
    },
    cardRingContainer: {
      width: 128,
      height: 128,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
    svgRing: {
      transform: [{ rotate: '-90deg' }],
    },
    cardRingOverlay: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'center',
      top: 0, left: 0, right: 0, bottom: 0,
    },
    cardRingPercent: {
      fontSize: 22,
      fontWeight: '700',
      color: textMain,
    },
    cardTextContainer: {
      alignItems: 'center',
    },
    cardLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: textMuted,
      textTransform: 'uppercase',
      letterSpacing: 2,
    },
    cardValue: {
      fontSize: 18,
      fontWeight: '700',
      color: textMain,
    },
    cardUnit: {
      fontSize: 14,
      fontWeight: '400',
      color: isDark ? '#64748b' : '#94a3b8',
    },
    insightsSection: {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
      gap: 16,
    },
    insightsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 8,
      marginBottom: 16,
    },
    insightsTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textMain,
    },
    insightsLink: {
      fontSize: 14,
      fontWeight: '600',
      color: '#ec5b13',
    },
    insightCard1: {
      flexDirection: 'row',
      backgroundColor: 'rgba(236, 91, 19, 0.05)',
      borderRadius: 24,
      borderWidth: 1,
      borderColor: 'rgba(236, 91, 19, 0.2)',
      padding: 24,
      alignItems: 'flex-start',
      gap: 16,
      marginBottom: 16,
    },
    insightIcon1Container: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: '#ec5b13',
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightContent: {
      flex: 1,
    },
    insightTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
      flexWrap: 'wrap',
    },
    insightTitle1: {
      fontWeight: '700',
      color: '#ec5b13',
      fontSize: 16,
    },
    badgeCritical: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 9999,
      backgroundColor: 'rgba(236, 91, 19, 0.1)',
    },
    badgeCriticalText: {
      fontSize: 12,
      fontWeight: '700',
      color: '#ec5b13',
      textTransform: 'uppercase',
    },
    insightBody1: {
      fontSize: 14,
      color: isDark ? '#cbd5e1' : '#334155', // slate-300 / slate-700
      lineHeight: 22,
    },
    insightActions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 16,
    },
    btnPrimary: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: '#ec5b13',
      borderRadius: 12,
      shadowColor: '#ec5b13',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    btnPrimaryText: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: '700',
    },
    btnSecondary: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: isDark ? '#1e293b' : 'rgba(255, 255, 255, 0.5)',
      borderRadius: 12,
    },
    btnSecondaryText: {
      color: isDark ? '#cbd5e1' : '#334155',
      fontSize: 14,
      fontWeight: '700',
    },
    insightCard2: {
      flexDirection: 'row',
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#f1f5f9', // slate-900/50 / slate-100
      borderRadius: 24,
      borderWidth: 1,
      borderColor: borderColor,
      padding: 24,
      alignItems: 'flex-start',
      gap: 16,
    },
    insightIcon2Container: {
      width: 48,
      height: 48,
      borderRadius: 16,
      backgroundColor: '#10b981', // emerald-500
      alignItems: 'center',
      justifyContent: 'center',
    },
    insightTitle2: {
      fontWeight: '700',
      color: textMain,
      fontSize: 16,
      marginBottom: 4,
    },
    insightBody2: {
      fontSize: 14,
      color: isDark ? '#94a3b8' : '#475569', // slate-400 / slate-600
      lineHeight: 22,
    },
  });
};
