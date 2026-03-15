/**
 * Profile & Settings Screen — Matches Stitch "Profile & Settings" design
 */

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useColorScheme } from '../../components/useColorScheme';
import { useNotificationSettingsStore } from '../../src/stores/useNotificationSettingsStore';
import {
  cancelScheduledNotifications,
  ensureNotificationPermissions,
  scheduleMealLoggingReminders,
  scheduleWorkoutReminder,
} from '../../src/services/notifications/notifications';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const styles = useMemo(() => createStyles(isDark), [isDark]);

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

  const handleComingSoon = (feature: string) => {
    Alert.alert('Feature Not Available', `${feature} is currently under development and will be available in a future update.`);
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

  const displayName = user?.displayName ?? 'Alex';
  const email = user?.email ?? 'alex@example.com';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Dynamic Header Background */}
      <View style={styles.headerBgWrapper}>
        <LinearGradient
          colors={
            isDark
              ? ['rgba(236, 91, 19, 0.4)', 'transparent']
              : ['rgba(236, 91, 19, 0.15)', 'transparent']
          }
          style={StyleSheet.absoluteFill}
        />
      </View>

      <View style={styles.headerTop}>
        <Text style={styles.headerTitleFixed}>Settings</Text>
        <TouchableOpacity style={styles.editButton} onPress={() => router.push({ pathname: '/modal', params: { type: 'profile' } })}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Info */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAZ3R4qJ6JDGoygMvbQ0Ywr46v22ed51uYIUXUGa1bfZn5sy6Y9ogNcZpaLqUETxcNkxTHOJjWAMrFE_9Xs83o7yQ6R2xOjOEV2jd8N68MvKq_cDf6pSjGD0ZBg541flkDSvGGO919WH93epEiIrrbHttc51YmRY-b_EZDHBQx11YNllzK0efPHfPYLN6gVFYkn6-L-X5rdq9ndTbmnoCsXnGcRYLWOYtlIDqGA52BPqKYNTQA9D0GsvuRtRxGw9hsJUJflA5i_anhq' }}
              style={styles.avatarImage}
            />
            <View style={styles.proBadge}>
              <MaterialIcons name="auto-awesome" size={12} color="#ffffff" />
            </View>
          </View>
          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{email}</Text>
          <Text style={styles.memberSince}>Member since 2023</Text>
        </View>

        {/* Action Buttons Grid */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(tabs)/fitness')}>
            <Text style={styles.quickActionCount}>31</Text>
            <Text style={styles.quickActionLabel}>Workouts</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(tabs)/fitness')}>
            <Text style={styles.quickActionCount}>14</Text>
            <Text style={styles.quickActionLabel}>Day Streak</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(tabs)/nutrition')}>
            <Text style={styles.quickActionCount}>4.2k</Text>
            <Text style={styles.quickActionLabel}>Avg Kcal</Text>
          </TouchableOpacity>
        </View>

        {/* Connected Devices */}
        <Text style={styles.sectionHeader}>CONNECTED DEVICES</Text>
        <View style={styles.sectionBlock}>
          <View style={styles.deviceRow}>
            <View style={[styles.deviceIconBg, { backgroundColor: '#10b981' }]}>
              <MaterialIcons name="watch" size={24} color="#ffffff" />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>Apple Watch Ultra</Text>
              <Text style={styles.deviceStatus}>Connected • Battery 82%</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => handleComingSoon('Device Settings')}
              trackColor={{ true: '#ec5b13' }}
            />
          </View>
          <View style={[styles.deviceRow, { borderBottomWidth: 0 }]}>
            <View style={[styles.deviceIconBg, { backgroundColor: '#3b82f6' }]}>
              <MaterialIcons name="monitor-weight" size={24} color="#ffffff" />
            </View>
            <View style={styles.deviceInfo}>
              <Text style={styles.deviceName}>Smart Scale</Text>
              <Text style={styles.deviceStatus}>Last sync: Today, 7:00 AM</Text>
            </View>
            <Switch
              value={true}
              onValueChange={() => handleComingSoon('Device Settings')}
              trackColor={{ true: '#ec5b13' }}
            />
          </View>
        </View>

        {/* Health Biometrics */}
        <Text style={styles.sectionHeader}>HEALTH BIOMETRICS</Text>
        <View style={styles.sectionBlock}>
          <TouchableOpacity style={styles.infoRow} onPress={() => router.push({ pathname: '/modal', params: { type: 'profile' } })}>
            <View style={styles.infoRowLeft}>
              <MaterialIcons name="height" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
              <Text style={styles.infoLabel}>Height</Text>
            </View>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoValue}>{user?.heightCm ? `${user.heightCm} cm` : 'Not set'}</Text>
              <MaterialIcons name="chevron-right" size={20} color={isDark ? '#475569' : '#94a3b8'} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoRow} onPress={() => router.push({ pathname: '/modal', params: { type: 'profile' } })}>
            <View style={styles.infoRowLeft}>
              <MaterialIcons name="monitor-weight" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
              <Text style={styles.infoLabel}>Weight</Text>
            </View>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoValue}>{user?.weightKg ? `${user.weightKg} kg` : 'Not set'}</Text>
              <MaterialIcons name="chevron-right" size={20} color={isDark ? '#475569' : '#94a3b8'} />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.infoRow, { borderBottomWidth: 0 }]} onPress={() => router.push({ pathname: '/modal', params: { type: 'goal' } })}>
            <View style={styles.infoRowLeft}>
              <MaterialIcons name="track-changes" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
              <Text style={styles.infoLabel}>Fitness Goal</Text>
            </View>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoValue}>{user?.fitnessGoal ? user.fitnessGoal.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Not set'}</Text>
              <MaterialIcons name="chevron-right" size={20} color={isDark ? '#475569' : '#94a3b8'} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <Text style={styles.sectionHeader}>PREFERENCES</Text>
        <View style={styles.sectionBlock}>
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <MaterialIcons name="notifications-active" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
              <Text style={styles.infoLabel}>Workout Reminders</Text>
            </View>
            <Switch
              value={workoutRemindersEnabled}
              onValueChange={handleToggleWorkout}
              disabled={updatingWorkout}
              trackColor={{ true: '#ec5b13' }}
            />
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoRowLeft}>
              <MaterialIcons name="restaurant-menu" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
              <Text style={styles.infoLabel}>Meal Logging Prompts</Text>
            </View>
            <Switch
              value={mealLoggingEnabled}
              onValueChange={handleToggleMeals}
              disabled={updatingMeals}
              trackColor={{ true: '#ec5b13' }}
            />
          </View>
          <TouchableOpacity style={[styles.infoRow, { borderBottomWidth: 0 }]} onPress={() => handleComingSoon('App Theme Customization')}>
            <View style={styles.infoRowLeft}>
              <MaterialIcons name="dark-mode" size={20} color={isDark ? '#cbd5e1' : '#475569'} />
              <Text style={styles.infoLabel}>App Theme</Text>
            </View>
            <View style={styles.infoRowRight}>
              <Text style={styles.infoValue}>System Settings</Text>
              <MaterialIcons name="chevron-right" size={20} color={isDark ? '#475569' : '#94a3b8'} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Account Actions */}
        <View style={styles.accountActionsSection}>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.versionText}>BeeFit App v1.2.4</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (isDark: boolean) => {
  const bgMain = isDark ? '#221610' : '#f8f6f6';
  const textMain = isDark ? '#f1f5f9' : '#0f172a';
  const textMuted = isDark ? '#94a3b8' : '#64748b';
  const cardBg = isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff';
  const borderColor = isDark ? '#1e293b' : '#e2e8f0';
  const primary = '#ec5b13';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bgMain },
    headerBgWrapper: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 300,
    },
    headerTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
    },
    headerTitleFixed: {
      fontSize: 24,
      fontWeight: '700',
      color: textMain,
      letterSpacing: -0.5,
    },
    editButton: {
      backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)',
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 9999,
    },
    editButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: textMain,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 16,
      paddingBottom: 100,
    },
    profileHeader: {
      alignItems: 'center',
      marginBottom: 32,
    },
    avatarContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      borderWidth: 4,
      borderColor: isDark ? '#221610' : '#f8f6f6',
      marginBottom: 16,
      position: 'relative',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 50,
    },
    proBadge: {
      position: 'absolute',
      bottom: -4,
      right: -4,
      backgroundColor: primary,
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: isDark ? '#221610' : '#f8f6f6',
    },
    userName: {
      fontSize: 24,
      fontWeight: '700',
      color: textMain,
      marginBottom: 4,
      letterSpacing: -0.5,
    },
    userEmail: {
      fontSize: 14,
      color: textMuted,
      marginBottom: 8,
    },
    memberSince: {
      fontSize: 12,
      color: primary,
      fontWeight: '600',
      backgroundColor: 'rgba(236, 91, 19, 0.1)',
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 9999,
    },
    quickActionsGrid: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 32,
    },
    quickActionCard: {
      flex: 1,
      backgroundColor: cardBg,
      borderRadius: 16,
      padding: 16,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: borderColor,
    },
    quickActionCount: {
      fontSize: 20,
      fontWeight: '800',
      color: textMain,
      marginBottom: 4,
    },
    quickActionLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionHeader: {
      fontSize: 12,
      fontWeight: '700',
      color: textMuted,
      marginBottom: 8,
      marginLeft: 16,
      letterSpacing: 1,
    },
    sectionBlock: {
      backgroundColor: cardBg,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: borderColor,
      marginBottom: 24,
      overflow: 'hidden',
    },
    deviceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    deviceIconBg: {
      width: 48,
      height: 48,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 16,
    },
    deviceInfo: {
      flex: 1,
    },
    deviceName: {
      fontSize: 16,
      fontWeight: '600',
      color: textMain,
      marginBottom: 2,
    },
    deviceStatus: {
      fontSize: 12,
      color: textMuted,
    },
    infoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: borderColor,
    },
    infoRowLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    infoLabel: {
      fontSize: 15,
      fontWeight: '500',
      color: textMain,
    },
    infoRowRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    infoValue: {
      fontSize: 14,
      color: textMuted,
    },
    accountActionsSection: {
      marginTop: 8,
      marginBottom: 32,
    },
    signOutButton: {
      backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#fee2e2',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#fecaca',
      padding: 16,
      borderRadius: 16,
      alignItems: 'center',
    },
    signOutText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#ef4444',
    },
    versionText: {
      textAlign: 'center',
      fontSize: 12,
      color: textMuted,
      marginBottom: 24,
    },
  });
};
