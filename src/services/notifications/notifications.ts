import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export const WORKOUT_REMINDER_TIME = { hour: 7, minute: 30 } as const;

export const MEAL_REMINDER_TIMES = [
  { hour: 9, minute: 0, label: 'Breakfast' },
  { hour: 13, minute: 0, label: 'Lunch' },
  { hour: 19, minute: 0, label: 'Dinner' },
] as const;

async function configureAndroidChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF9500',
  });
}

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.warn('[Notifications] Must be used on a physical device');
    return false;
  }

  const settings = await Notifications.getPermissionsAsync();
  let status = settings.status;

  if (status !== 'granted') {
    const request = await Notifications.requestPermissionsAsync();
    status = request.status;
  }

  if (status !== 'granted') return false;

  await configureAndroidChannel();
  return true;
}

export async function cancelScheduledNotifications(ids: Array<string | null | undefined>): Promise<void> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean))) as string[];
  await Promise.all(
    uniqueIds.map(async (id) => {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (error) {
        console.warn('[Notifications] Failed to cancel notification', id, error);
      }
    })
  );
}

export async function scheduleWorkoutReminder(existingId?: string | null): Promise<string | null> {
  if (existingId) {
    await cancelScheduledNotifications([existingId]);
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Workout reminder',
      body: 'Time to move. Your BeeFit workout is ready!',
      sound: 'default',
      data: { type: 'workout-reminder' },
    },
    trigger: {
      hour: WORKOUT_REMINDER_TIME.hour,
      minute: WORKOUT_REMINDER_TIME.minute,
      repeats: true,
    },
  });
}

export async function scheduleMealLoggingReminders(existingIds: string[] = []): Promise<string[]> {
  if (existingIds.length) {
    await cancelScheduledNotifications(existingIds);
  }

  const ids: string[] = [];

  for (const slot of MEAL_REMINDER_TIMES) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${slot.label} check-in`,
        body: 'Log your meal to keep your nutrition on track.',
        sound: 'default',
        data: { type: 'meal-logging', slot: slot.label },
      },
      trigger: {
        hour: slot.hour,
        minute: slot.minute,
        repeats: true,
      },
    });
    ids.push(id);
  }

  return ids;
}

export async function getExpoPushToken(): Promise<string | null> {
  const hasPermission = await ensureNotificationPermissions();
  if (!hasPermission) return null;

  const token = await Notifications.getExpoPushTokenAsync();
  return token.data;
}
