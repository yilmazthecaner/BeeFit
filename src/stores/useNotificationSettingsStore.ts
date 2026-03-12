import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationSettingsState {
  workoutRemindersEnabled: boolean;
  mealLoggingEnabled: boolean;
  workoutReminderId: string | null;
  mealLoggingReminderIds: string[];
  setWorkoutRemindersEnabled: (enabled: boolean) => void;
  setMealLoggingEnabled: (enabled: boolean) => void;
  setWorkoutReminderId: (id: string | null) => void;
  setMealLoggingReminderIds: (ids: string[]) => void;
}

export const useNotificationSettingsStore = create<NotificationSettingsState>()(
  persist(
    (set) => ({
      workoutRemindersEnabled: false,
      mealLoggingEnabled: false,
      workoutReminderId: null,
      mealLoggingReminderIds: [],
      setWorkoutRemindersEnabled: (enabled) => set({ workoutRemindersEnabled: enabled }),
      setMealLoggingEnabled: (enabled) => set({ mealLoggingEnabled: enabled }),
      setWorkoutReminderId: (id) => set({ workoutReminderId: id }),
      setMealLoggingReminderIds: (ids) => set({ mealLoggingReminderIds: ids }),
    }),
    {
      name: 'beefit.notification-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useNotificationSettingsStore;
