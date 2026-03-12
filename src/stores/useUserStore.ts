/**
 * User Store — Zustand state management for user profile
 */

import { create } from 'zustand';
import type { UserProfile, FitnessGoal, ActivityLevel } from '../types/user';
import supabase from '../services/supabase/client';

interface UserState {
  // ── State ──
  profile: UserProfile | null;
  isLoading: boolean;
  error: string | null;

  // ── Actions ──
  fetchProfile: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  updateGoals: (goal: FitnessGoal, activityLevel: ActivityLevel) => Promise<void>;
  updateMacroTargets: (calories: number, protein: number, carbs: number, fat: number) => Promise<void>;
  signOut: () => void;
}

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isLoading: false,
  error: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      set({
        profile: {
          id: data.id,
          email: data.email,
          displayName: data.display_name,
          avatarUrl: data.avatar_url,
          dateOfBirth: data.date_of_birth,
          gender: data.gender,
          heightCm: data.height_cm,
          weightKg: data.weight_kg,
          fitnessGoal: data.fitness_goal,
          activityLevel: data.activity_level,
          dailyCalorieTarget: data.daily_calorie_target,
          dailyProteinG: data.daily_protein_g,
          dailyCarbsG: data.daily_carbs_g,
          dailyFatG: data.daily_fat_g,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        },
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    const profile = get().profile;
    if (!profile) return;

    set({ isLoading: true });
    try {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
      if (updates.heightCm !== undefined) dbUpdates.height_cm = updates.heightCm;
      if (updates.weightKg !== undefined) dbUpdates.weight_kg = updates.weightKg;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.dateOfBirth !== undefined) dbUpdates.date_of_birth = updates.dateOfBirth;
      dbUpdates.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('users')
        .update(dbUpdates)
        .eq('id', profile.id);

      if (error) throw error;

      set({
        profile: { ...profile, ...updates, updatedAt: dbUpdates.updated_at as string },
        isLoading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
    }
  },

  updateGoals: async (goal, activityLevel) => {
    const profile = get().profile;
    if (!profile) return;

    const { error } = await supabase
      .from('users')
      .update({
        fitness_goal: goal,
        activity_level: activityLevel,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (!error) {
      set({
        profile: { ...profile, fitnessGoal: goal, activityLevel },
      });
    }
  },

  updateMacroTargets: async (calories, protein, carbs, fat) => {
    const profile = get().profile;
    if (!profile) return;

    const { error } = await supabase
      .from('users')
      .update({
        daily_calorie_target: calories,
        daily_protein_g: protein,
        daily_carbs_g: carbs,
        daily_fat_g: fat,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (!error) {
      set({
        profile: {
          ...profile,
          dailyCalorieTarget: calories,
          dailyProteinG: protein,
          dailyCarbsG: carbs,
          dailyFatG: fat,
        },
      });
    }
  },

  signOut: () => {
    supabase.auth.signOut();
    set({ profile: null, error: null });
  },
}));

export default useUserStore;
