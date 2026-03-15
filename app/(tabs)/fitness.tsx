/**
 * Fitness / Health Screen — Smart Fitness Tracker (Stitch Design)
 *
 * Sections:
 * - Header with fitness icon + date
 * - Apple Watch Stats (heart rate, calories) in 2-col grid
 * - Generate Dynamic Workout CTA
 * - Today's Plan with workout items (images, tags)
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColorScheme } from '../../components/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// ════════════════════════════════════════
// MOCK DATA
// ════════════════════════════════════════

const watchStats = {
  heartRate: { value: 72, unit: 'BPM', change: '+5%', label: 'Heart Rate' },
  calories: { value: 450, unit: 'kcal', change: '-2%', label: 'Active Calories' },
};

const todaysWorkouts = [
  {
    id: '1',
    title: 'Morning Yoga',
    duration: '20 mins',
    intensity: 'Low Intensity',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDB88a47Jpcimg28cy3e7XnZnKQMl0fa_vRd1MOx0ufcd4vw3FMaWOfThZovxZfUZ5rhmvYquoBCtamqEqCTpEvSYgnhgJVuC4IFBNrz34Zz8qmjOFv9ikOiDWEUU-zmCLDOuz8Q7tM0zD3JObv1YZOso_qUlbDqMQF_0l18jFJjnyWDZuJBd32P5XlE7atF9hue-HCvPqEUFnit44Ele_NzPTva78Ih9S9TZwfuBU6sEgO8HKgCNAtyMD0G7Hxlfcy645MbENYF0Zi',
    tags: ['Flexibility', 'Beginner'],
  },
  {
    id: '2',
    title: 'Full Body Strength',
    duration: '45 mins',
    intensity: 'High Intensity',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDBeJ1F6OC1OjiojCiYc-wlyLT6VrEcz6lbOTSFEYslRRMG85giNYppbsSIYvpUNyrAED5QO_gkjg-gO-oqvoltz9GVAfGTYop9DOZlcGdOVJgrJ_EbhNvttf1duJ4Ypt5VYcGpkhpMnFPUC3gPUIcLUSyTZirOVvb2HM8eZT5i2sGtQSRwadlXwnKjyIOGdZUtJIWZgWxo72vYucfSyVhWJG2OhyPSyGpO0JuFSBhUv1dS87sGfzobY2I8CJUlK9ORCnZBozEv6BSM',
    tags: ['Strength', 'Advanced'],
    isHighlight: true,
  },
  {
    id: '3',
    title: 'Evening HIIT',
    duration: '15 mins',
    intensity: 'Intense',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDI9JknLAESf0yhqSAll8-nKsTmN0rBPbiNucryE6mmA_3hzXyNw-dco9wnnLmgecMnkptZ8AtsqD3SnHZ_VpiBEXB4-_zkpT3BsSsrwGVvoldtpG7KbRzJQUPudds1flmgiztgNEqzaLXFWSZC5CY2_6ycctCCOJfyMRjolqT_EPfiws-d1AWWGRbyMuSF750_FCArrIjOnnUQ0Uv1bBTovgRXOInMzTFmdIH-gdtCU5CkKvFK_akZ_d73KFpMd8ckR__5cnbjA3E7',
    tags: ['Cardio'],
  },
];

const todayDate = new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'short',
  day: 'numeric',
});

// ════════════════════════════════════════
// SCREEN
// ════════════════════════════════════════

export default function FitnessScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);
  const router = useRouter();

  const handleGenerateWorkout = () => {
    Alert.alert(
      'Generate Workout',
      'AI will create a personalized workout based on your Apple Watch data and recovery status.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Generate', onPress: () => Alert.alert('✨ Workout Generated!', 'Your dynamic workout plan is ready.') },
      ]
    );
  };

  const handleWorkoutPress = (workout: typeof todaysWorkouts[0]) => {
    (router.push as any)({
      pathname: '/workout-detail',
      params: { title: workout.title },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.headerIconBg}>
            <MaterialIcons name="fitness-center" size={22} color="#ec5b13" />
          </View>
          <View>
            <Text style={styles.headerTitle}>Fitness Pro</Text>
            <Text style={styles.headerDate}>{todayDate}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.profileButton}>
          <MaterialIcons name="person" size={22} color="#ec5b13" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Apple Watch Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statsHeaderRow}>
            <View style={styles.statsHeaderLeft}>
              <MaterialIcons name="watch" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              <Text style={styles.statsLabel}>APPLE WATCH STATS</Text>
            </View>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>Live</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {/* Heart Rate */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <MaterialIcons name="favorite" size={22} color="#ef4444" />
                <Text style={styles.changePositive}>{watchStats.heartRate.change}</Text>
              </View>
              <Text style={styles.statValue}>
                {watchStats.heartRate.value}{' '}
                <Text style={styles.statUnit}>{watchStats.heartRate.unit}</Text>
              </Text>
              <Text style={styles.statLabel}>{watchStats.heartRate.label}</Text>
            </View>

            {/* Calories */}
            <View style={styles.statCard}>
              <View style={styles.statCardHeader}>
                <MaterialIcons name="local-fire-department" size={22} color="#ec5b13" />
                <Text style={styles.changePrimary}>{watchStats.calories.change}</Text>
              </View>
              <Text style={styles.statValue}>
                {watchStats.calories.value}{' '}
                <Text style={styles.statUnit}>{watchStats.calories.unit}</Text>
              </Text>
              <Text style={styles.statLabel}>{watchStats.calories.label}</Text>
            </View>
          </View>
        </View>

        {/* Generate Workout CTA */}
        <TouchableOpacity
          style={styles.generateBtn}
          activeOpacity={0.8}
          onPress={handleGenerateWorkout}
        >
          <MaterialIcons name="auto-awesome" size={24} color="#ffffff" />
          <Text style={styles.generateBtnText}>Generate Dynamic Workout</Text>
        </TouchableOpacity>

        {/* Today's Plan */}
        <View style={styles.planSection}>
          <View style={styles.planHeaderRow}>
            <Text style={styles.planTitle}>Today's Plan</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {todaysWorkouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              style={styles.workoutCard}
              activeOpacity={0.7}
              onPress={() => handleWorkoutPress(workout)}
            >
              <View style={styles.workoutImageContainer}>
                <Image
                  source={{ uri: workout.image }}
                  style={styles.workoutImage}
                />
              </View>
              <View style={styles.workoutInfo}>
                <Text style={styles.workoutTitle}>{workout.title}</Text>
                <Text style={styles.workoutMeta}>
                  {workout.duration} • {workout.intensity}
                </Text>
                <View style={styles.tagsRow}>
                  {workout.tags.map((tag) => (
                    <View
                      key={tag}
                      style={[
                        styles.tag,
                        workout.isHighlight && tag === workout.tags[0]
                          ? styles.tagHighlight
                          : null,
                      ]}
                    >
                      <Text
                        style={[
                          styles.tagText,
                          workout.isHighlight && tag === workout.tags[0]
                            ? styles.tagTextHighlight
                            : null,
                        ]}
                      >
                        {tag}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <TouchableOpacity style={styles.moreButton}>
                <MaterialIcons
                  name="more-vert"
                  size={20}
                  color={isDark ? '#64748b' : '#94a3b8'}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════
// STYLES
// ════════════════════════════════════════

const createStyles = (isDark: boolean) => {
  const bgMain = isDark ? '#221610' : '#f8f6f6';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? '#0f172a' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';
  const primary = '#ec5b13';

  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: bgMain,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    headerIconBg: {
      backgroundColor: 'rgba(236, 91, 19, 0.1)',
      padding: 8,
      borderRadius: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: textMain,
    },
    headerDate: {
      fontSize: 12,
      color: textMuted,
    },
    profileButton: {
      backgroundColor: 'rgba(236, 91, 19, 0.1)',
      padding: 8,
      borderRadius: 9999,
    },
    scrollContent: {
      paddingBottom: 100,
    },

    // ── Apple Watch Stats ──
    statsSection: {
      padding: 24,
    },
    statsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    statsHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    statsLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    liveBadge: {
      backgroundColor: isDark ? '#1e293b' : '#e2e8f0',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    liveBadgeText: {
      fontSize: 10,
      color: textMuted,
    },
    statsGrid: {
      flexDirection: 'row',
      gap: 16,
    },
    statCard: {
      flex: 1,
      backgroundColor: cardBg,
      padding: 20,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
    },
    statCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    changePositive: {
      fontSize: 12,
      fontWeight: '500',
      color: '#22c55e',
    },
    changePrimary: {
      fontSize: 12,
      fontWeight: '500',
      color: primary,
    },
    statValue: {
      fontSize: 24,
      fontWeight: '700',
      color: textMain,
      letterSpacing: -0.5,
    },
    statUnit: {
      fontSize: 14,
      fontWeight: '400',
      color: isDark ? '#64748b' : '#94a3b8',
    },
    statLabel: {
      fontSize: 12,
      color: textMuted,
      marginTop: 4,
    },

    // ── Generate Workout CTA ──
    generateBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: primary,
      marginHorizontal: 24,
      marginBottom: 32,
      paddingVertical: 16,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 12,
      shadowColor: primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    generateBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ffffff',
    },

    // ── Today's Plan ──
    planSection: {
      paddingHorizontal: 24,
    },
    planHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    planTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: textMain,
    },
    viewAllText: {
      fontSize: 14,
      fontWeight: '500',
      color: primary,
    },

    // ── Workout Card ──
    workoutCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      backgroundColor: cardBg,
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: borderColor,
      marginBottom: 16,
    },
    workoutImageContainer: {
      width: 80,
      height: 80,
      borderRadius: 8,
      overflow: 'hidden',
    },
    workoutImage: {
      width: '100%',
      height: '100%',
    },
    workoutInfo: {
      flex: 1,
    },
    workoutTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: textMain,
    },
    workoutMeta: {
      fontSize: 12,
      color: textMuted,
      marginTop: 2,
    },
    tagsRow: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 8,
    },
    tag: {
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
    },
    tagHighlight: {
      backgroundColor: 'rgba(236, 91, 19, 0.1)',
    },
    tagText: {
      fontSize: 10,
      color: isDark ? '#cbd5e1' : '#475569',
    },
    tagTextHighlight: {
      color: primary,
    },
    moreButton: {
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      padding: 8,
      borderRadius: 9999,
    },
  });
};
