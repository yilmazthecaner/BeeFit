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
import { useFitnessStore } from '../../src/stores/useFitnessStore';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const router = useRouter();

  const { user } = useAuthStore();
  
  const getFirstName = () => {
    const u = user as any;
    if (u?.user_metadata?.first_name) return u.user_metadata.first_name;
    if (u?.user_metadata?.full_name) return u.user_metadata.full_name.split(' ')[0];
    if (user?.displayName) return user.displayName.split(' ')[0];
    if (user?.email) return user.email.split('@')[0];
    return 'Alex';
  };
  const userName = getFirstName();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const { getDailyTotals } = useNutritionStore();
  const dailyTotals = getDailyTotals();

  const { healthData, initializeHealthKit } = useFitnessStore();

  React.useEffect(() => {
    initializeHealthKit();
  }, []);

  // Header matching Stitch exactly
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.profileImageContainer}
        onPress={() => router.push('/(tabs)/profile')}
      >
        <Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ3R4qJ6JDGoygMvbQ0Ywr46v22ed51uYIUXUGa1bfZn5sy6Y9ogNcZpaLqUETxcNkxTHOJjWAMrFE_9Xs83o7yQ6R2xOjOEV2jd8N68MvKq_cDf6pSjGD0ZBg541flkDSvGGO919WH93epEiIrrbHttc51YmRY-b_EZDHBQx11YNllzK0efPHfPYLN6gVFYkn6-L-X5rdq9ndTbmnoCsXnGcRYLWOYtlIDqGA52BPqKYNTQA9D0GsvuRtRxGw9hsJUJflA5i_anhq' }}
          style={styles.profileImage}
        />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerSubtitle}>TODAY</Text>
        <TouchableOpacity 
          style={styles.headerTitleRow}
          onPress={() => (router.push as any)('/coach-chat')}
        >
          <MaterialIcons name="auto-awesome" size={14} color="#ec5b13" />
          <Text style={styles.headerTitleText}>Bee Coach</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.headerRight}>
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <MaterialIcons name="settings" size={24} color="#ec5b13" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const [showInsight, setShowInsight] = React.useState(true);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderHeader()}
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.greetingSection}>
          <Text style={styles.greetingTitle}>{getGreeting()}, {userName}.</Text>
          <Text style={styles.greetingText}>
            "You've recovered exceptionally well. Your heart rate variability is up 15%, suggesting today is perfect for a high-intensity session."
          </Text>
        </View>

        <View style={styles.activityGrid}>
          <NestedActivityRings 
            moveVal={Math.max(healthData.activeCalories, dailyTotals.calories)} 
            moveTarget={600} 
            exerciseVal={Math.max(healthData.exerciseMinutes, 15)} 
            exerciseTarget={30} 
            standVal={8} 
            standTarget={12} 
            styles={styles} 
            isDark={isDark} 
          />
        </View>

        <View style={styles.insightsSection}>
          <View style={styles.insightsHeader}>
            <Text style={styles.insightsTitle}>Proactive Insights</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/fitness')}>
              <Text style={styles.insightsLink}>View History</Text>
            </TouchableOpacity>
          </View>

          {/* Insight Card 1 */}
          {showInsight && (
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
                  <TouchableOpacity 
                    style={styles.btnPrimary}
                    onPress={() => router.push('/(tabs)/nutrition')}
                  >
                    <Text style={styles.btnPrimaryText}>Log Meal</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.btnSecondary}
                    onPress={() => setShowInsight(false)}
                  >
                    <Text style={styles.btnSecondaryText}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

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

function NestedActivityRings({ moveVal, moveTarget, exerciseVal, exerciseTarget, standVal, standTarget, styles, isDark }: any) {
  const rs = [50, 36, 22]; // Radii for Move, Exercise, Stand
  const strk = 12; // stroke width
  const center = 70; // cx, cy

  const movePct = Math.min(moveVal / moveTarget, 1);
  const exPct = Math.min(exerciseVal / exerciseTarget, 1);
  const standPct = Math.min(standVal / standTarget, 1);

  const getOffset = (r: number, pct: number) => {
    const circ = 2 * Math.PI * r;
    return circ - pct * circ;
  };

  return (
    <View style={styles.nestedRingsContainer}>
      <View style={styles.nestedRingsLeft}>
        <Svg width="140" height="140" viewBox="0 0 140 140" style={styles.svgRing}>
          {/* Background Rings */}
          <Circle cx={center} cy={center} r={rs[0]} stroke="#ec5b13" strokeOpacity={0.15} strokeWidth={strk} fill="transparent" />
          <Circle cx={center} cy={center} r={rs[1]} stroke="#10b981" strokeOpacity={0.15} strokeWidth={strk} fill="transparent" />
          <Circle cx={center} cy={center} r={rs[2]} stroke="#0ea5e9" strokeOpacity={0.15} strokeWidth={strk} fill="transparent" />
          {/* Active Rings */}
          <Circle cx={center} cy={center} r={rs[0]} stroke="#ec5b13" strokeWidth={strk} fill="transparent" strokeDasharray={2 * Math.PI * rs[0]} strokeDashoffset={getOffset(rs[0], movePct)} strokeLinecap="round" />
          <Circle cx={center} cy={center} r={rs[1]} stroke="#10b981" strokeWidth={strk} fill="transparent" strokeDasharray={2 * Math.PI * rs[1]} strokeDashoffset={getOffset(rs[1], exPct)} strokeLinecap="round" />
          <Circle cx={center} cy={center} r={rs[2]} stroke="#0ea5e9" strokeWidth={strk} fill="transparent" strokeDasharray={2 * Math.PI * rs[2]} strokeDashoffset={getOffset(rs[2], standPct)} strokeLinecap="round" />
        </Svg>
      </View>
      <View style={styles.nestedRingsRight}>
        <View style={styles.ringLegendItem}>
          <MaterialIcons name="local-fire-department" size={16} color="#ec5b13" />
          <View>
            <Text style={styles.ringLegendLabel}>Move</Text>
            <Text style={styles.ringLegendValue}>{moveVal}/{moveTarget} kcal</Text>
          </View>
        </View>
        <View style={styles.ringLegendItem}>
          <MaterialIcons name="fitness-center" size={16} color="#10b981" />
          <View>
            <Text style={styles.ringLegendLabel}>Exercise</Text>
            <Text style={styles.ringLegendValue}>{exerciseVal}/{exerciseTarget} min</Text>
          </View>
        </View>
        <View style={styles.ringLegendItem}>
          <MaterialIcons name="accessibility-new" size={16} color="#0ea5e9" />
          <View>
            <Text style={styles.ringLegendLabel}>Stand</Text>
            <Text style={styles.ringLegendValue}>{standVal}/{standTarget} hr</Text>
          </View>
        </View>
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
    nestedRingsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: cardBg,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: borderColor,
      padding: 24,
      gap: 24,
    },
    nestedRingsLeft: {
      width: 140,
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
    },
    svgRing: {
      transform: [{ rotate: '-90deg' }],
    },
    nestedRingsRight: {
      flex: 1,
      gap: 16,
      justifyContent: 'center',
    },
    ringLegendItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
    },
    ringLegendLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginBottom: 2,
    },
    ringLegendValue: {
      fontSize: 16,
      fontWeight: '700',
      color: textMain,
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
