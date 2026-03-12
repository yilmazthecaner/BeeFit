/**
 * Profile Screen — Wired to auth store for live user data
 */

import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, BorderRadius, Shadows } from '../../src/constants/theme';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useColorScheme } from '../../components/useColorScheme';
import { useNotificationSettingsStore } from '../../src/stores/useNotificationSettingsStore';
import {
  cancelScheduledNotifications,
  ensureNotificationPermissions,
  scheduleMealLoggingReminders,
  scheduleWorkoutReminder,
} from '../../src/services/notifications/notifications';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const palette = Colors[colorScheme];
  const styles = useMemo(() => createStyles(palette), [palette]);

  const { user, signOut } = useAuthStore();
  const {
    workoutRemindersEnabled,
    mealLoggingEnabled,
    workoutReminderId,
    mealLoggingReminderIds,
    setWorkoutRemindersEnabled,
    setMealLoggingEnabled,
    setWorkoutReminderId,
    setMealLoggingReminderIds,
  } = useNotificationSettingsStore();
  const [updatingWorkout, setUpdatingWorkout] = useState(false);
  const [updatingMeals, setUpdatingMeals] = useState(false);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleToggleWorkout = async (nextValue: boolean) => {
    if (updatingWorkout) return;
    setUpdatingWorkout(true);
    try {
      if (nextValue) {
        const granted = await ensureNotificationPermissions();
        if (!granted) {
          Alert.alert('Notifications Disabled', 'Enable notifications to get workout reminders.');
          return;
        }
        const id = await scheduleWorkoutReminder(workoutReminderId);
        setWorkoutReminderId(id);
        setWorkoutRemindersEnabled(true);
      } else {
        await cancelScheduledNotifications([workoutReminderId]);
        setWorkoutReminderId(null);
        setWorkoutRemindersEnabled(false);
      }
    } catch (error) {
      console.error('[Notifications] Workout toggle failed', error);
      Alert.alert('Notifications Error', 'Could not update workout reminders. Please try again.');
    } finally {
      setUpdatingWorkout(false);
    }
  };

  const handleToggleMeals = async (nextValue: boolean) => {
    if (updatingMeals) return;
    setUpdatingMeals(true);
    try {
      if (nextValue) {
        const granted = await ensureNotificationPermissions();
        if (!granted) {
          Alert.alert('Notifications Disabled', 'Enable notifications to get meal logging prompts.');
          return;
        }
        const ids = await scheduleMealLoggingReminders(mealLoggingReminderIds);
        setMealLoggingReminderIds(ids);
        setMealLoggingEnabled(true);
      } else {
        await cancelScheduledNotifications(mealLoggingReminderIds);
        setMealLoggingReminderIds([]);
        setMealLoggingEnabled(false);
      }
    } catch (error) {
      console.error('[Notifications] Meal toggle failed', error);
      Alert.alert('Notifications Error', 'Could not update meal logging prompts. Please try again.');
    } finally {
      setUpdatingMeals(false);
    }
  };

  const displayName = user?.displayName ?? 'User';
  const email = user?.email ?? '';

  const goalLabels: Record<string, string> = {
    lose_weight: 'Lose Weight',
    build_muscle: 'Build Muscle',
    maintain: 'Maintain',
    endurance: 'Endurance',
    general: 'General Fitness',
  };

  const activityLabels: Record<string, string> = {
    sedentary: 'Sedentary',
    light: 'Light',
    moderate: 'Moderate',
    active: 'Active',
    very_active: 'Very Active',
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Avatar & Name */}
        <View style={styles.header}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{email}</Text>
        </View>

        {/* Goals */}
        <SectionCard title="Goals" styles={styles}>
          <SettingRow label="Fitness Goal" value={goalLabels[user?.fitnessGoal ?? ''] ?? 'Not set'} styles={styles} />
          <SettingRow label="Activity Level" value={activityLabels[user?.activityLevel ?? ''] ?? 'Not set'} styles={styles} />
        </SectionCard>

        {/* Body Metrics */}
        <SectionCard title="Body Metrics" styles={styles}>
          <SettingRow label="Height" value={user?.heightCm ? `${user.heightCm} cm` : 'Not set'} styles={styles} />
          <SettingRow label="Weight" value={user?.weightKg ? `${user.weightKg} kg` : 'Not set'} styles={styles} />
        </SectionCard>

        {/* Nutrition Targets */}
        <SectionCard title="Daily Targets" styles={styles}>
          <SettingRow label="Calories" value={user?.dailyCalorieTarget ? `${user.dailyCalorieTarget} kcal` : '—'} styles={styles} />
          <SettingRow label="Protein" value={user?.dailyProteinG ? `${user.dailyProteinG}g` : '—'} styles={styles} />
          <SettingRow label="Carbs" value={user?.dailyCarbsG ? `${user.dailyCarbsG}g` : '—'} styles={styles} />
          <SettingRow label="Fat" value={user?.dailyFatG ? `${user.dailyFatG}g` : '—'} styles={styles} />
        </SectionCard>

        {/* Notifications */}
        <SectionCard title="Notifications" styles={styles}>
          <SettingToggleRow
            label="Workout reminders"
            description="Daily reminder to start your workout"
            value={workoutRemindersEnabled}
            onValueChange={handleToggleWorkout}
            disabled={updatingWorkout}
            styles={styles}
            palette={palette}
          />
          <SettingToggleRow
            label="Meal logging prompts"
            description="Breakfast, lunch, and dinner nudges"
            value={mealLoggingEnabled}
            onValueChange={handleToggleMeals}
            disabled={updatingMeals}
            styles={styles}
            palette={palette}
          />
        </SectionCard>

        {/* Connected Devices */}
        <SectionCard title="Connected Devices" styles={styles}>
          <View style={styles.deviceRow}>
            <Text style={{ fontSize: 22 }}>⌚</Text>
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={styles.deviceName}>Apple Watch</Text>
              <Text style={styles.deviceStatus}>Not connected</Text>
            </View>
          </View>
        </SectionCard>

        {/* Account Actions */}
        <SectionCard title="Account" styles={styles}>
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.6}>
            <Text style={styles.actionText}>Export Health Data</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionRow} activeOpacity={0.6}>
            <Text style={styles.actionText}>Privacy Policy</Text>
            <Text style={styles.arrow}>›</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionRow, { borderBottomWidth: 0 }]} onPress={handleSignOut} activeOpacity={0.6}>
            <Text style={[styles.actionText, { color: Colors.systemRed }]}>Sign Out</Text>
          </TouchableOpacity>
        </SectionCard>

        <Text style={styles.version}>BeeFit v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionCard({ title, children, styles }: { title: string; children: React.ReactNode; styles: Styles }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>{children}</View>
    </View>
  );
}

function SettingRow({ label, value, styles }: { label: string; value: string; styles: Styles }) {
  return (
    <TouchableOpacity style={styles.settingRow} activeOpacity={0.6}>
      <Text style={styles.settingLabel}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={styles.settingValue}>{value}</Text>
        <Text style={styles.arrow}>›</Text>
      </View>
    </TouchableOpacity>
  );
}

function SettingToggleRow({
  label,
  description,
  value,
  onValueChange,
  disabled,
  styles,
  palette,
}: {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  styles: Styles;
  palette: Palette;
}) {
  return (
    <View style={styles.settingRow}>
      <View style={{ flex: 1, paddingRight: Spacing.md }}>
        <Text style={styles.settingLabel}>{label}</Text>
        {description && <Text style={styles.settingDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: palette.fill, true: Colors.primary + '80' }}
        thumbColor={value ? '#FFFFFF' : palette.surfaceElevated}
        ios_backgroundColor={palette.fill}
      />
    </View>
  );
}

type Palette = typeof Colors.light;
type Styles = ReturnType<typeof createStyles>;

const createStyles = (palette: Palette) => StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.groupedBackground },
  scroll: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  header: { alignItems: 'center', paddingVertical: Spacing.xl },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.sm },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFF' },
  name: { ...Typography.title2, color: palette.text },
  email: { ...Typography.subhead, color: palette.textSecondary, marginTop: 2 },
  section: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.footnote, color: palette.textSecondary, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.xs, paddingLeft: Spacing.md },
  sectionContent: { backgroundColor: palette.surfaceElevated, borderRadius: BorderRadius.lg, ...Shadows.sm },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: palette.separator },
  settingLabel: { ...Typography.body, color: palette.text },
  settingValue: { ...Typography.body, color: palette.textSecondary, marginRight: Spacing.xs },
  settingDescription: { ...Typography.caption1, color: palette.textSecondary, marginTop: 2 },
  arrow: { fontSize: 20, color: palette.textTertiary, fontWeight: '300' },
  deviceRow: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
  deviceName: { ...Typography.body, color: palette.text },
  deviceStatus: { ...Typography.caption1, color: palette.textTertiary, marginTop: 2 },
  actionRow: { padding: Spacing.md, borderBottomWidth: 0.5, borderBottomColor: palette.separator, flexDirection: 'row', justifyContent: 'space-between' },
  actionText: { ...Typography.body, color: Colors.systemBlue },
  version: { ...Typography.caption1, color: palette.textTertiary, textAlign: 'center', marginTop: Spacing.lg },
});
