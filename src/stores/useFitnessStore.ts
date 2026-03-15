/**
 * Fitness Store — Zustand state for workouts and plans
 */

import { create } from 'zustand';
import type { WorkoutLog, WorkoutPlan } from '../types/workout';
import supabase from '../services/supabase/client';
import AppleHealthKit, { HealthValue, HealthInputOptions } from 'react-native-health';
import { Platform } from 'react-native';

interface FitnessState {
  // ── State ──
  todaysWorkouts: WorkoutLog[];
  weeklyWorkouts: WorkoutLog[];
  activePlan: WorkoutPlan | null;
  healthData: {
    steps: number;
    activeCalories: number;
    exerciseMinutes: number;
  };
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;

  // ── Actions ──
  initializeHealthKit: () => Promise<void>;
  fetchHealthKitData: () => Promise<void>;
  fetchTodaysWorkouts: (userId: string) => Promise<void>;
  fetchWeeklyWorkouts: (userId: string) => Promise<void>;
  fetchActivePlan: (userId: string) => Promise<void>;
  addWorkoutLog: (workout: Omit<WorkoutLog, 'id' | 'createdAt'>) => Promise<void>;
  generateWorkout: (userId: string, planType?: 'daily'|'weekly'|'monthly', equipment?: string[]) => Promise<void>;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (date: string) => void;
}

export const useFitnessStore = create<FitnessState>((set, get) => ({
  todaysWorkouts: [],
  weeklyWorkouts: [],
  activePlan: null,
  healthData: {
    steps: 0,
    activeCalories: 0,
    exerciseMinutes: 0,
  },
  isLoading: false,
  isSyncing: false,
  lastSyncAt: null,

  initializeHealthKit: async () => {
    if (Platform.OS !== 'ios') return;
    return new Promise((resolve) => {
      const permissions = {
        permissions: {
          read: [
            AppleHealthKit.Constants.Permissions.StepCount,
            AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
            AppleHealthKit.Constants.Permissions.AppleExerciseTime,
          ],
          write: [],
        },
      } as any;

      AppleHealthKit.initHealthKit(permissions, (error: string) => {
        if (error) {
          console.log('[ERROR] Cannot grant permissions to Apple HealthKit', error);
          resolve(); // resolve anyway so app continues
          return;
        }
        console.log('[DEBUG] HealthKit permissions granted');
        get().fetchHealthKitData().then(resolve);
      });
    });
  },

  fetchHealthKitData: async () => {
    if (Platform.OS !== 'ios') return;
    const options: HealthInputOptions = {
      date: new Date().toISOString(),
      includeManuallyAdded: true,
    };

    let steps = 0;
    let activeCalories = 0;
    let exerciseMinutes = 0;

    await new Promise<void>((resolve) => {
      AppleHealthKit.getStepCount(options, (err: string, results: HealthValue) => {
        if (!err && results) steps = results.value;
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(options, (err: string, results: HealthValue[]) => {
        if (!err && results && results.length > 0) {
          // getActiveEnergyBurned can return an array or single val depending on how called, summarize if array
          activeCalories = results.reduce((sum, item) => sum + item.value, 0);
        }
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      AppleHealthKit.getAppleExerciseTime(options, (err: string, results: HealthValue[]) => {
        if (!err && results && results.length > 0) {
          exerciseMinutes = results.reduce((sum, item) => sum + item.value, 0);
        }
        resolve();
      });
    });

    set((state) => ({
      healthData: {
        ...state.healthData,
        steps: Math.round(steps),
        activeCalories: Math.round(activeCalories),
        exerciseMinutes: Math.round(exerciseMinutes),
      }
    }));
  },

  fetchTodaysWorkouts: async (userId) => {
    set({ isLoading: true });
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', todayStart.toISOString())
      .order('logged_at', { ascending: false });

    set({
      todaysWorkouts: (data ?? []).map(mapWorkoutRow),
      isLoading: false,
    });
  },

  fetchWeeklyWorkouts: async (userId) => {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    weekStart.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('logged_at', weekStart.toISOString())
      .order('logged_at', { ascending: false });

    set({ weeklyWorkouts: (data ?? []).map(mapWorkoutRow) });
  },

  fetchActivePlan: async (userId) => {
    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      set({
        activePlan: {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          planType: data.plan_type,
          goal: data.goal,
          equipment: data.equipment ?? [],
          generatedBy: data.generated_by,
          planData: data.plan_data ?? [],
          isActive: data.is_active,
          startsAt: data.starts_at,
          endsAt: data.ends_at,
          createdAt: data.created_at,
        },
      });
    }
  },

  addWorkoutLog: async (workout) => {
    const { data, error } = await supabase
      .from('workout_logs')
      .insert({
        user_id: workout.userId,
        plan_id: workout.planId ?? null,
        workout_type: workout.workoutType,
        title: workout.title,
        duration_minutes: workout.durationMinutes,
        calories_burned: workout.caloriesBurned,
        avg_heart_rate: workout.avgHeartRate,
        max_heart_rate: workout.maxHeartRate,
        source: workout.source,
        external_id: workout.externalId,
        exercises: workout.exercises,
        notes: workout.notes,
        logged_at: workout.loggedAt,
      })
      .select()
      .single();

    if (!error && data) {
      set((state) => ({
        todaysWorkouts: [mapWorkoutRow(data), ...state.todaysWorkouts],
      }));
    }
  },

  generateWorkout: async (userId, planType = 'daily', equipment = []) => {
    set({ isLoading: true });
    try {
      const { data, error } = await supabase.functions.invoke('generate-workout', {
        body: { userId, planType, equipment },
      });

      if (error) throw error;
      
      // Attempt to refresh the newly active plan
      await useFitnessStore.getState().fetchActivePlan(userId);
    } catch (error: any) {
      console.error('generateWorkout error:', error.message);
      if (error.message?.includes('non-2xx status code')) {
         alert('Bee Coach AI quota exceeded. Please top up API billing to generate workouts.');
      } else {
         alert('Failed to generate workout. Please try again later.');
      }
    } finally {
      set({ isLoading: false });
    }
  },

  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setLastSync: (date) => set({ lastSyncAt: date }),
}));

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapWorkoutRow(row: any): WorkoutLog {
  return {
    id: row.id,
    userId: row.user_id,
    planId: row.plan_id,
    workoutType: row.workout_type,
    title: row.title,
    durationMinutes: row.duration_minutes,
    caloriesBurned: row.calories_burned,
    avgHeartRate: row.avg_heart_rate,
    maxHeartRate: row.max_heart_rate,
    source: row.source,
    externalId: row.external_id,
    exercises: row.exercises,
    notes: row.notes,
    loggedAt: row.logged_at,
    createdAt: row.created_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

export default useFitnessStore;
