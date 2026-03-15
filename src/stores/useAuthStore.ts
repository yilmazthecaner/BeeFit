/**
 * Auth Store — Supabase Authentication State
 *
 * Manages sign-in, sign-up, session persistence,
 * and automatic user profile creation on first sign-up.
 */

import { create } from 'zustand';
import supabase from '../services/supabase/client';
import type { UserProfile } from '../types/user';

interface AuthState {
  // ── State ──
  user: UserProfile | null;
  session: { access_token: string; user: { id: string; email: string } } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  error: string | null;

  // ── Actions ──
  initialize: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signUpWithEmail: (email: string, password: string, displayName: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<boolean>;
  updateProfile: (data: Partial<OnboardingData> & { displayName?: string }) => Promise<boolean>;
  clearError: () => void;
}

export interface OnboardingData {
  gender?: 'male' | 'female' | 'other';
  dateOfBirth?: string;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal: 'lose_weight' | 'build_muscle' | 'maintain' | 'endurance' | 'general';
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  dailyCalorieTarget?: number;
  dailyProteinG?: number;
  dailyCarbsG?: number;
  dailyFatG?: number;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true,
  isOnboarded: false,
  error: null,

  /**
   * Initialize auth state by checking for existing session.
   * Called once on app launch.
   */
  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        // Fetch user profile
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({
            session: {
              access_token: session.access_token,
              user: { id: session.user.id, email: session.user.email ?? '' },
            },
            user: mapProfileRow(profile),
            isAuthenticated: true,
            isOnboarded: !!profile.fitness_goal,
            isLoading: false,
          });
        } else {
          // Session exists but no profile → needs onboarding
          set({
            session: {
              access_token: session.access_token,
              user: { id: session.user.id, email: session.user.email ?? '' },
            },
            isAuthenticated: true,
            isOnboarded: false,
            isLoading: false,
          });
        }
      } else {
        set({ isLoading: false });
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_OUT') {
          set({
            user: null,
            session: null,
            isAuthenticated: false,
            isOnboarded: false,
          });
        }
      });
    } catch (error) {
      set({ isLoading: false, error: (error as Error).message });
    }
  },

  signInWithEmail: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch profile
      const { data: profile } = await supabase
        .from('users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      set({
        session: {
          access_token: data.session.access_token,
          user: { id: data.user.id, email: data.user.email ?? '' },
        },
        user: profile ? mapProfileRow(profile) : null,
        isAuthenticated: true,
        isOnboarded: !!profile?.fitness_goal,
        isLoading: false,
      });

      return true;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return false;
    }
  },

  signUpWithEmail: async (email, password, displayName) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed — no user returned');

      // Create user profile row
      const { error: profileError } = await supabase
        .from('users')
        .insert({
          id: data.user.id,
          email,
          display_name: displayName,
        });

      if (profileError) throw profileError;

      set({
        session: data.session ? {
          access_token: data.session.access_token,
          user: { id: data.user.id, email },
        } : null,
        user: {
          id: data.user.id,
          email,
          displayName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        isAuthenticated: !!data.session,
        isOnboarded: false,
        isLoading: false,
      });

      return true;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return false;
    }
  },

  completeOnboarding: async (onboardingData) => {
    const { session } = get();
    if (!session) return false;

    set({ isLoading: true, error: null });
    try {
      // Calculate default macro targets if not provided
      const macros = calculateMacros(onboardingData);

      const { data, error } = await supabase
        .from('users')
        .update({
          gender: onboardingData.gender,
          date_of_birth: onboardingData.dateOfBirth,
          height_cm: onboardingData.heightCm,
          weight_kg: onboardingData.weightKg,
          fitness_goal: onboardingData.fitnessGoal,
          activity_level: onboardingData.activityLevel,
          daily_calorie_target: onboardingData.dailyCalorieTarget ?? macros.calories,
          daily_protein_g: onboardingData.dailyProteinG ?? macros.protein,
          daily_carbs_g: onboardingData.dailyCarbsG ?? macros.carbs,
          daily_fat_g: onboardingData.dailyFatG ?? macros.fat,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      set({
        user: mapProfileRow(data),
        isOnboarded: true,
        isLoading: false,
      });

      return true;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return false;
    }
  },

  updateProfile: async (profileData) => {
    const { session } = get();
    if (!session) return false;

    set({ isLoading: true, error: null });
    try {
      const payload: any = { updated_at: new Date().toISOString() };
      
      if (profileData.displayName !== undefined) payload.display_name = profileData.displayName;
      if (profileData.heightCm !== undefined) payload.height_cm = profileData.heightCm;
      if (profileData.weightKg !== undefined) payload.weight_kg = profileData.weightKg;
      if (profileData.fitnessGoal !== undefined) payload.fitness_goal = profileData.fitnessGoal;
      
      // We don't recalculate macros here unless it's a full goal change, 
      // but for simplicity we'll just update the exact fields passed.

      const { data, error } = await supabase
        .from('users')
        .update(payload)
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;

      set({
        user: mapProfileRow(data),
        isLoading: false,
      });

      return true;
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false });
      return false;
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({
      user: null,
      session: null,
      isAuthenticated: false,
      isOnboarded: false,
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));

// ── Helpers ──

/* eslint-disable @typescript-eslint/no-explicit-any */
function mapProfileRow(row: any): UserProfile {
  return {
    id: row.id,
    email: row.email,
    displayName: row.display_name,
    avatarUrl: row.avatar_url,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    heightCm: row.height_cm,
    weightKg: row.weight_kg,
    fitnessGoal: row.fitness_goal,
    activityLevel: row.activity_level,
    dailyCalorieTarget: row.daily_calorie_target,
    dailyProteinG: row.daily_protein_g,
    dailyCarbsG: row.daily_carbs_g,
    dailyFatG: row.daily_fat_g,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

function calculateMacros(data: OnboardingData) {
  // Simplified Mifflin-St Jeor estimation
  const weight = data.weightKg ?? 75;
  const height = data.heightCm ?? 175;
  const age = data.dateOfBirth
    ? Math.floor((Date.now() - new Date(data.dateOfBirth).getTime()) / 31557600000)
    : 30;

  let bmr: number;
  if (data.gender === 'female') {
    bmr = 10 * weight + 6.25 * height - 5 * age - 161;
  } else {
    bmr = 10 * weight + 6.25 * height - 5 * age + 5;
  }

  const activityMultipliers: Record<string, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const tdee = bmr * (activityMultipliers[data.activityLevel] ?? 1.55);

  let calories: number;
  switch (data.fitnessGoal) {
    case 'lose_weight': calories = Math.round(tdee - 500); break;
    case 'build_muscle': calories = Math.round(tdee + 300); break;
    default: calories = Math.round(tdee);
  }

  const protein = Math.round(weight * (data.fitnessGoal === 'build_muscle' ? 2.0 : 1.6));
  const fat = Math.round(calories * 0.25 / 9);
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4);

  return { calories, protein, carbs, fat };
}

export default useAuthStore;
