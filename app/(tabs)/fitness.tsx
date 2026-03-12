/**
 * Fitness Screen
 *
 * Dashboard showing:
 * - Today's workout plan (from AI-generated plan)
 * - Workout completion cards
 * - Weekly activity summary
 * - Recent workout history
 * - Wearable sync status
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useColorScheme } from '../../components/useColorScheme';

// ════════════════════════════════════════
// MOCK DATA (replaced by Zustand stores in production)
// ════════════════════════════════════════

const todaysPlan = {
  title: 'Upper Body Push',
  estimatedDuration: 45,
  exercises: [
    { name: 'Bench Press', sets: 4, reps: 8, weight: '80 kg' },
    { name: 'Overhead Press', sets: 3, reps: 10, weight: '40 kg' },
    { name: 'Incline DB Press', sets: 3, reps: 12, weight: '24 kg' },
    { name: 'Lateral Raises', sets: 3, reps: 15, weight: '8 kg' },
    { name: 'Tricep Pushdowns', sets: 3, reps: 12, weight: '25 kg' },
  ],
};

const weeklyProgress = [
  { day: 'Mon', completed: true, type: 'Chest' },
  { day: 'Tue', completed: true, type: 'Back' },
  { day: 'Wed', completed: false, type: 'Rest' },
  { day: 'Thu', completed: false, type: 'Legs' },
  { day: 'Fri', completed: false, type: 'Shoulders' },
  { day: 'Sat', completed: false, type: 'Arms' },
  { day: 'Sun', completed: false, type: 'Rest' },
];

const recentWorkouts = [
  {
    id: '1',
    title: 'Back & Biceps',
    type: 'strength',
    duration: 52,
    calories: 420,
    date: 'Yesterday',
    source: 'Apple Watch',
  },
  {
    id: '2',
    title: 'Chest & Triceps',
    type: 'strength',
    duration: 48,
    calories: 380,
    date: '2 days ago',
    source: 'Manual',
  },
  {
    id: '3',
    title: 'Morning Run',
    type: 'cardio',
    duration: 32,
    calories: 310,
    date: '3 days ago',
    source: 'Apple Watch',
  },
];

// ════════════════════════════════════════
// SCREEN COMPONENT
// ════════════════════════════════════════

export default function FitnessScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [selectedExercise, setSelectedExercise] = useState<number | null>(null);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Today's Workout Card ── */}
        <View style={styles.workoutCard}>
          <View style={styles.workoutHeader}>
            <View>
              <Text style={styles.workoutLabel}>TODAY'S WORKOUT</Text>
              <Text style={styles.workoutTitle}>{todaysPlan.title}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>
                {todaysPlan.estimatedDuration} min
              </Text>
            </View>
          </View>

          {/* Exercise List */}
          {todaysPlan.exercises.map((exercise, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.exerciseRow,
                selectedExercise === index && styles.exerciseRowSelected,
              ]}
              onPress={() =>
                setSelectedExercise(
                  selectedExercise === index ? null : index
                )
              }
              activeOpacity={0.7}
            >
              <View style={styles.exerciseIndex}>
                <Text style={styles.exerciseIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseDetail}>
                  {exercise.sets}×{exercise.reps} · {exercise.weight}
                </Text>
              </View>
              <Text style={styles.exerciseCheckmark}>
                {selectedExercise === index ? '✓' : ''}
              </Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity style={styles.startButton} activeOpacity={0.8}>
            <Text style={styles.startButtonText}>Start Workout</Text>
          </TouchableOpacity>
        </View>

        {/* ── Weekly Progress ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>This Week</Text>
          <View style={styles.weekRow}>
            {weeklyProgress.map((day, index) => (
              <View key={index} style={styles.dayColumn}>
                <View
                  style={[
                    styles.dayDot,
                    day.completed && styles.dayDotCompleted,
                    day.type === 'Rest' && styles.dayDotRest,
                  ]}
                >
                  {day.completed && (
                    <Text style={styles.dayCheckmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.dayLabel}>{day.day}</Text>
                <Text style={styles.dayType}>{day.type}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ── Recent Workouts ── */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Recent Workouts</Text>
          {recentWorkouts.map((workout) => (
            <View key={workout.id} style={styles.workoutHistoryRow}>
              <View style={styles.workoutHistoryIcon}>
                <Text style={styles.workoutHistoryEmoji}>
                  {workout.type === 'strength' ? '🏋️' : '🏃'}
                </Text>
              </View>
              <View style={styles.workoutHistoryInfo}>
                <Text style={styles.workoutHistoryTitle}>
                  {workout.title}
                </Text>
                <Text style={styles.workoutHistoryMeta}>
                  {workout.duration} min · {workout.calories} kcal ·{' '}
                  {workout.date}
                </Text>
              </View>
              <View style={styles.sourceBadge}>
                <Text style={styles.sourceText}>
                  {workout.source === 'Apple Watch' ? '⌚' : '✏️'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* ── Sync Status ── */}
        <View style={styles.syncCard}>
          <Text style={styles.syncIcon}>⌚</Text>
          <View style={styles.syncInfo}>
            <Text style={styles.syncTitle}>Apple Watch Connected</Text>
            <Text style={styles.syncDetail}>Last synced 5 min ago</Text>
          </View>
          <View style={styles.syncDot} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ════════════════════════════════════════
// STYLES
// ════════════════════════════════════════

type Palette = typeof Colors.light;

const createStyles = (palette: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.groupedBackground,
  },
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },

  // ── Workout Card ──
  workoutCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  workoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  workoutLabel: {
    ...Typography.caption1,
    color: Colors.primary,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  workoutTitle: {
    ...Typography.title2,
    color: palette.text,
  },
  durationBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  durationText: {
    ...Typography.caption1,
    color: Colors.primary,
    fontWeight: '600',
  },

  // ── Exercises ──
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.separator,
  },
  exerciseRowSelected: {
    backgroundColor: Colors.systemGreen + '10',
    borderRadius: BorderRadius.sm,
    marginHorizontal: -Spacing.xs,
    paddingHorizontal: Spacing.xs,
  },
  exerciseIndex: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  exerciseIndexText: {
    ...Typography.caption1,
    fontWeight: '600',
    color: palette.textSecondary,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    ...Typography.body,
    color: palette.text,
  },
  exerciseDetail: {
    ...Typography.caption1,
    color: palette.textSecondary,
    marginTop: 2,
  },
  exerciseCheckmark: {
    fontSize: 18,
    color: Colors.systemGreen,
    fontWeight: '700',
  },

  // ── Start Button ──
  startButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  startButtonText: {
    ...Typography.headline,
    color: '#FFFFFF',
  },

  // ── Section Card ──
  sectionCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  sectionTitle: {
    ...Typography.headline,
    color: palette.text,
    marginBottom: Spacing.md,
  },

  // ── Weekly Progress ──
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayColumn: {
    alignItems: 'center',
  },
  dayDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: palette.separator,
    marginBottom: Spacing.xs,
  },
  dayDotCompleted: {
    backgroundColor: Colors.systemGreen,
    borderColor: Colors.systemGreen,
  },
  dayDotRest: {
    borderColor: palette.textTertiary,
    borderStyle: 'dashed',
  },
  dayCheckmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  dayLabel: {
    ...Typography.caption1,
    fontWeight: '600',
    color: palette.text,
  },
  dayType: {
    ...Typography.caption2,
    color: palette.textSecondary,
  },

  // ── Workout History ──
  workoutHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 0.5,
    borderBottomColor: palette.separator,
  },
  workoutHistoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: palette.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  workoutHistoryEmoji: {
    fontSize: 20,
  },
  workoutHistoryInfo: {
    flex: 1,
  },
  workoutHistoryTitle: {
    ...Typography.body,
    color: palette.text,
  },
  workoutHistoryMeta: {
    ...Typography.caption1,
    color: palette.textSecondary,
    marginTop: 2,
  },
  sourceBadge: {
    marginLeft: Spacing.sm,
  },
  sourceText: {
    fontSize: 16,
  },

  // ── Sync Card ──
  syncCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.surfaceElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.sm,
  },
  syncIcon: {
    fontSize: 24,
    marginRight: Spacing.sm,
  },
  syncInfo: {
    flex: 1,
  },
  syncTitle: {
    ...Typography.subhead,
    color: palette.text,
    fontWeight: '600',
  },
  syncDetail: {
    ...Typography.caption1,
    color: palette.textSecondary,
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.systemGreen,
  },
});
