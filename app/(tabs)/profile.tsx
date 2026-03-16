/**
 * Profile & Settings Screen — Matches Stitch "Profile & Settings" design
 */

import React, { useMemo, useState, useEffect } from 'react';
import { useSubscription } from '../../src/hooks/useSubscription';
import { useNotificationSettingsStore } from '../../src/stores/useNotificationSettingsStore';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  Image,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/stores/useAuthStore';
import { useColorScheme } from '../../components/useColorScheme';
import { useFitnessStore } from '../../src/stores/useFitnessStore';
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
  const { tier, isPremium, loading: subLoading } = useSubscription();
  const { healthKitAuthorized, initializeHealthKit, lastSyncAt, isSyncing, healthData, todaysWorkouts, fetchTodaysWorkouts } = useFitnessStore();
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
  const [connectingDevice, setConnectingDevice] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchTodaysWorkouts(user.id);
    }
  }, [user?.id]);

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  };

  const handleComingSoon = (feature: string) => {
    Alert.alert('Feature Not Available', `${feature} is currently under development and will be available in a future update.`);
  };

  const handleConnectDevice = async () => {
    if (!isPremium) {
      router.push('/paywall' as any);
      return;
    }

    if (Platform.OS !== 'ios') {
      Alert.alert('Not Supported', 'Device sync is currently available only on iOS via Apple Health.');
      return;
    }

    if (connectingDevice) return;
    setConnectingDevice(true);
    try {
      const granted = await initializeHealthKit();
      if (granted) {
        Alert.alert('Connected', 'Apple Health is now connected.');
      } else {
        Alert.alert('Permission Needed', 'Please allow Health access to connect your device.');
      }
    } catch (error) {
      console.error('[Device] Connect failed', error);
      Alert.alert('Connection Failed', 'Unable to connect at the moment. Please try again.');
    } finally {
      setConnectingDevice(false);
    }
  };

  const handleOpenDeviceSettings = () => {
    if (Platform.OS !== 'ios') {
      Alert.alert('Not Supported', 'Device settings are available on iOS only.');
      return;
    }
    Alert.alert('Manage Health Access', 'Open Settings to manage Apple Health permissions.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Open Settings', onPress: () => Linking.openSettings() },
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

  const getDisplayName = () => {
    const u = user as any;
    if (u?.user_metadata?.full_name) return u.user_metadata.full_name;
    if (u?.user_metadata?.name) return u.user_metadata.name;
    if (user?.displayName) return user.displayName;
    return 'User';
  };

  const displayName = getDisplayName();
  const email = user?.email ?? 'user@example.com';
  const lastSyncLabel = lastSyncAt
    ? new Date(lastSyncAt).toLocaleString()
    : 'Not synced yet';

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

        {/* Subscription Info Card */}
        <TouchableOpacity 
          style={[styles.subscriptionCard, tier === 'premium' ? styles.premiumCard : styles.freeCard]}
          onPress={() => router.push('/paywall' as any)}
        >
          <View style={styles.subCardMain}>
            <View style={styles.subIconBg}>
              <MaterialIcons name={tier === 'premium' ? 'verified' : 'stars'} size={24} color={tier === 'premium' ? '#34c759' : '#ff9500'} />
            </View>
            <View style={styles.subInfo}>
              <Text style={styles.subStatusText}>
                {tier === 'premium' ? 'Premium Üye' : tier === 'trialing' ? 'Deneme Sürümü' : 'Ücretsiz Plan'}
              </Text>
              <Text style={styles.subDetailText}>
                {tier === 'premium' ? 'Tüm özellikler açık' : tier === 'trialing' ? 'Limitleri kaldırmak için abone ol.' : 'AI özellikleri limitli.'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#94a3b8" />
          </View>
          {tier === 'trialing' && (
            <View style={styles.trialBar}>
              <Text style={styles.trialBarText}>Deneme sürümün devam ediyor.</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Action Buttons Grid */}
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(tabs)/fitness')}>
            <Text style={styles.quickActionCount}>{todaysWorkouts.length}</Text>
            <Text style={styles.quickActionLabel}>Today</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(tabs)/fitness')}>
            <Text style={styles.quickActionCount}>{Math.round(healthData.steps / 1000)}k</Text>
            <Text style={styles.quickActionLabel}>Steps</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionCard} onPress={() => router.push('/(tabs)/nutrition')}>
            <Text style={styles.quickActionCount}>{healthData.activeCalories}</Text>
            <Text style={styles.quickActionLabel}>Active kcal</Text>
          </TouchableOpacity>
        </View>

        {/* Connected Devices */}
        <Text style={styles.sectionHeader}>CONNECTED DEVICES</Text>
        <View style={styles.sectionBlock}>
          {healthKitAuthorized ? (
            <>
              <View style={styles.deviceRow}>
                <View style={[styles.deviceIconBg, { backgroundColor: '#10b981' }]}>
                  <MaterialIcons name="watch" size={24} color="#ffffff" />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>Apple Health</Text>
                  <Text style={styles.deviceStatus}>
                    {isSyncing ? 'Syncing...' : `Last sync: ${lastSyncLabel}`}
                  </Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={handleOpenDeviceSettings}
                  trackColor={{ true: '#ec5b13' }}
                />
              </View>
              <View style={[styles.deviceRow, { borderBottomWidth: 0 }]}>
                <View style={[styles.deviceIconBg, { backgroundColor: '#3b82f6' }]}>
                  <MaterialIcons name="monitor-weight" size={24} color="#ffffff" />
                </View>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>Smart Scale</Text>
                  <Text style={styles.deviceStatus}>Coming soon</Text>
                </View>
                <Switch
                  value={true}
                  onValueChange={() => handleComingSoon('Smart Scale')}
                  trackColor={{ true: '#ec5b13' }}
                />
              </View>
            </>
          ) : (
            <TouchableOpacity 
              style={[styles.infoRow, { justifyContent: 'center', borderBottomWidth: 0, paddingVertical: 20 }]}
              onPress={handleConnectDevice}
              disabled={connectingDevice}
            >
              {connectingDevice ? (
                <ActivityIndicator color="#ec5b13" style={{ marginRight: 8 }} />
              ) : (
                <MaterialIcons name="add-circle-outline" size={24} color="#ec5b13" style={{ marginRight: 8 }} />
              )}
              <Text style={[styles.infoLabel, { color: '#ec5b13', fontWeight: '600' }]}>
                {connectingDevice ? 'Connecting...' : 'Connect a Device'}
              </Text>
            </TouchableOpacity>
          )}
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
    subscriptionCard: {
      borderRadius: 16,
      borderWidth: 1,
      marginBottom: 24,
      overflow: 'hidden',
    },
    freeCard: {
      backgroundColor: isDark ? 'rgba(255, 149, 0, 0.05)' : '#fff9f0',
      borderColor: isDark ? 'rgba(255, 149, 0, 0.2)' : '#ffe8cc',
    },
    premiumCard: {
      backgroundColor: isDark ? 'rgba(52, 199, 89, 0.05)' : '#f0fff4',
      borderColor: isDark ? 'rgba(52, 199, 89, 0.2)' : '#c6f6d5',
    },
    subCardMain: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      gap: 12,
    },
    subIconBg: {
      width: 44,
      height: 44,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.5)' : '#ffffff',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    subInfo: {
      flex: 1,
    },
    subStatusText: {
      fontSize: 16,
      fontWeight: '700',
      color: textMain,
      marginBottom: 2,
    },
    subDetailText: {
      fontSize: 13,
      color: textMuted,
    },
    trialBar: {
      backgroundColor: '#ff9500',
      paddingVertical: 4,
      alignItems: 'center',
    },
    trialBarText: {
      fontSize: 11,
      fontWeight: '700',
      color: '#ffffff',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
  });
};
