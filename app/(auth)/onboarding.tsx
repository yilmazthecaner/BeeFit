/**
 * Onboarding Screen — Collect user fitness profile after sign-up
 *
 * Multi-step flow:
 * 1. Fitness goal (lose weight, build muscle, etc.)
 * 2. Body metrics (height, weight, gender)
 * 3. Activity level
 * → Auto-calculates daily macro targets
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore, type OnboardingData } from '../../src/stores/useAuthStore';
import { useColorScheme } from '../../components/useColorScheme';

type Step = 'goal' | 'metrics' | 'activity';

const goals = [
  { key: 'lose_weight', emoji: '🔥', title: 'Lose Weight', desc: 'Burn fat, get leaner' },
  { key: 'build_muscle', emoji: '💪', title: 'Build Muscle', desc: 'Gain size and strength' },
  { key: 'maintain', emoji: '⚖️', title: 'Maintain', desc: 'Stay where you are' },
  { key: 'endurance', emoji: '🏃', title: 'Endurance', desc: 'Improve stamina' },
  { key: 'general', emoji: '🌟', title: 'General Fitness', desc: 'Overall health' },
] as const;

const activityLevels = [
  { key: 'sedentary', emoji: '🪑', title: 'Sedentary', desc: 'Little or no exercise' },
  { key: 'light', emoji: '🚶', title: 'Light', desc: '1-3 days/week' },
  { key: 'moderate', emoji: '🏋️', title: 'Moderate', desc: '3-5 days/week' },
  { key: 'active', emoji: '⚡', title: 'Active', desc: '6-7 days/week' },
  { key: 'very_active', emoji: '🔥', title: 'Very Active', desc: 'Athlete level' },
] as const;

export default function OnboardingScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = useMemo(() => createStyles(palette), [palette]);

  const [step, setStep] = useState<Step>('goal');
  const [data, setData] = useState<Partial<OnboardingData>>({});
  const { completeOnboarding, isLoading } = useAuthStore();

  const [heightStr, setHeightStr] = useState('');
  const [weightStr, setWeightStr] = useState('');

  const handleGoalSelect = (goal: OnboardingData['fitnessGoal']) => {
    setData({ ...data, fitnessGoal: goal });
    setStep('metrics');
  };

  const handleMetricsNext = () => {
    setData({
      ...data,
      heightCm: heightStr ? parseFloat(heightStr) : undefined,
      weightKg: weightStr ? parseFloat(weightStr) : undefined,
    });
    setStep('activity');
  };

  const handleActivitySelect = async (level: OnboardingData['activityLevel']) => {
    const finalData: OnboardingData = {
      ...data,
      activityLevel: level,
      fitnessGoal: data.fitnessGoal ?? 'general',
    };

    await completeOnboarding(finalData);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Progress dots */}
        <View style={styles.progress}>
          {['goal', 'metrics', 'activity'].map((s_step, i) => (
            <View
              key={s_step}
              style={[
                styles.dot,
                s_step === step && styles.dotActive,
                ['goal', 'metrics', 'activity'].indexOf(step) > i && styles.dotDone,
              ]}
            />
          ))}
        </View>

        {step === 'goal' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>What's your goal?</Text>
            <Text style={styles.stepSubtitle}>We'll personalize everything for you</Text>
            <View style={styles.optionsGrid}>
              {goals.map((g) => (
                <TouchableOpacity
                  key={g.key}
                  style={[styles.optionCard, data.fitnessGoal === g.key && styles.optionCardSelected]}
                  onPress={() => handleGoalSelect(g.key)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{g.emoji}</Text>
                  <Text style={styles.optionTitle}>{g.title}</Text>
                  <Text style={styles.optionDesc}>{g.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 'metrics' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>About you</Text>
            <Text style={styles.stepSubtitle}>This helps calculate your targets</Text>

            <View style={styles.metricsForm}>
              {/* Gender */}
              <Text style={styles.fieldLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {(['male', 'female', 'other'] as const).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, data.gender === g && styles.genderBtnActive]}
                    onPress={() => setData({ ...data, gender: g })}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.genderText, data.gender === g && styles.genderTextActive]}>
                      {g === 'male' ? '♂ Male' : g === 'female' ? '♀ Female' : '⚧ Other'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Height & Weight */}
              <View style={styles.metricsRow}>
                <View style={styles.metricField}>
                  <Text style={styles.fieldLabel}>Height (cm)</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={heightStr}
                    onChangeText={setHeightStr}
                    placeholder="175"
                    placeholderTextColor={palette.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.metricField}>
                  <Text style={styles.fieldLabel}>Weight (kg)</Text>
                  <TextInput
                    style={styles.metricInput}
                    value={weightStr}
                    onChangeText={setWeightStr}
                    placeholder="75"
                    placeholderTextColor={palette.textTertiary}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.nextBtn} onPress={handleMetricsNext} activeOpacity={0.8}>
                <Text style={styles.nextBtnText}>Continue</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleMetricsNext} activeOpacity={0.6}>
                <Text style={styles.skipText}>Skip for now</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {step === 'activity' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Activity level?</Text>
            <Text style={styles.stepSubtitle}>How often do you exercise?</Text>
            <View style={styles.optionsGrid}>
              {activityLevels.map((a) => (
                <TouchableOpacity
                  key={a.key}
                  style={styles.optionCard}
                  onPress={() => handleActivitySelect(a.key)}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={Colors.primary} />
                  ) : (
                    <>
                      <Text style={styles.optionEmoji}>{a.emoji}</Text>
                      <Text style={styles.optionTitle}>{a.title}</Text>
                      <Text style={styles.optionDesc}>{a.desc}</Text>
                    </>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type Palette = typeof Colors.light;

const createStyles = (palette: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background },
  scroll: { padding: Spacing.xl, paddingBottom: Spacing.xxl },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing.xl },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: palette.textTertiary },
  dotActive: { width: 24, backgroundColor: Colors.primary },
  dotDone: { backgroundColor: Colors.systemGreen },
  stepContainer: { alignItems: 'center' },
  stepTitle: { ...Typography.largeTitle, color: palette.text, textAlign: 'center' },
  stepSubtitle: { ...Typography.body, color: palette.textSecondary, textAlign: 'center', marginTop: Spacing.xs, marginBottom: Spacing.xl },
  optionsGrid: { width: '100%', gap: Spacing.md },
  optionCard: {
    backgroundColor: palette.surfaceElevated,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    ...Shadows.sm,
  },
  optionCardSelected: { borderColor: Colors.primary },
  optionEmoji: { fontSize: 32, marginBottom: Spacing.sm },
  optionTitle: { ...Typography.headline, color: palette.text },
  optionDesc: { ...Typography.footnote, color: palette.textSecondary, marginTop: 2 },
  metricsForm: { width: '100%', gap: Spacing.lg },
  fieldLabel: { ...Typography.footnote, color: palette.textSecondary, fontWeight: '600', marginBottom: 4 },
  genderRow: { flexDirection: 'row', gap: Spacing.sm },
  genderBtn: {
    flex: 1,
    backgroundColor: palette.surface,
    borderRadius: BorderRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  genderText: { ...Typography.subhead, color: palette.textSecondary },
  genderTextActive: { color: Colors.primary, fontWeight: '600' },
  metricsRow: { flexDirection: 'row', gap: Spacing.md },
  metricField: { flex: 1 },
  metricInput: {
    backgroundColor: palette.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.body,
    color: palette.text,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
  },
  nextBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: 16,
    alignItems: 'center',
    ...Shadows.md,
  },
  nextBtnText: { ...Typography.headline, color: '#FFF' },
  skipText: { ...Typography.subhead, color: palette.textSecondary, textAlign: 'center', marginTop: Spacing.sm },
});
