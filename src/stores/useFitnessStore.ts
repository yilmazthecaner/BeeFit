/**
 * Fitness Store — Zustand state for workouts and plans
 */

import { create } from 'zustand';
import type { WorkoutLog, WorkoutPlan } from '../types/workout';
import supabase from '../services/supabase/client';

interface FitnessState {
  // ── State ──
  todaysWorkouts: WorkoutLog[];
  weeklyWorkouts: WorkoutLog[];
  activePlan: WorkoutPlan | null;
  isLoading: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;

  // ── Actions ──
  fetchTodaysWorkouts: (userId: string) => Promise<void>;
  fetchWeeklyWorkouts: (userId: string) => Promise<void>;
  fetchActivePlan: (userId: string) => Promise<void>;
  addWorkoutLog: (workout: Omit<WorkoutLog, 'id' | 'createdAt'>) => Promise<void>;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (date: string) => void;
}

export const useFitnessStore = create<FitnessState>((set) => ({
  todaysWorkouts: [],
  weeklyWorkouts: [],
  activePlan: null,
  isLoading: false,
  isSyncing: false,
  lastSyncAt: null,

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
