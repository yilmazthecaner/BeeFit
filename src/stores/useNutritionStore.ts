/**
 * Nutrition Store — Zustand state for meals and daily nutrition
 */

import { create } from 'zustand';
import type { MealLog, DailyNutritionSummary } from '../types/nutrition';
import supabase from '../services/supabase/client';

interface NutritionState {
  // ── State ──
  todaysMeals: MealLog[];
  dailySummary: DailyNutritionSummary | null;
  isLoading: boolean;
  isAnalyzing: boolean;  // true while Vision API is processing

  // ── Actions ──
  fetchTodaysMeals: (userId: string, targetDate?: Date) => Promise<void>;
  addMealLog: (meal: MealLog) => void;
  setAnalyzing: (analyzing: boolean) => void;
  getDailyTotals: () => { calories: number; protein: number; carbs: number; fat: number };
}

export const useNutritionStore = create<NutritionState>((set, get) => ({
  todaysMeals: [],
  dailySummary: null,
  isLoading: false,
  isAnalyzing: false,

  fetchTodaysMeals: async (userId, targetDate) => {
    set({ isLoading: true });
    const start = targetDate ? new Date(targetDate) : new Date();
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from('meal_logs')
      .select('*, meal_items(*)')
      .eq('user_id', userId)
      .gte('logged_at', start.toISOString())
      .lte('logged_at', end.toISOString())
      .order('logged_at', { ascending: true });

    const meals: MealLog[] = (data ?? []).map((row) => ({
      id: row.id,
      userId: row.user_id,
      mealType: row.meal_type,
      photoUrl: row.photo_url,
      totalCalories: row.total_calories,
      totalProteinG: row.total_protein_g,
      totalCarbsG: row.total_carbs_g,
      totalFatG: row.total_fat_g,
      totalFiberG: row.total_fiber_g,
      items: (row.meal_items ?? []).map((item: Record<string, unknown>) => ({
        id: item.id as string,
        mealId: item.meal_id as string,
        foodName: item.food_name as string,
        portionSize: item.portion_size as string,
        calories: item.calories as number,
        proteinG: item.protein_g as number,
        carbsG: item.carbs_g as number,
        fatG: item.fat_g as number,
        fiberG: item.fiber_g as number,
        confidence: item.confidence as number,
      })),
      aiAnalysis: row.ai_analysis,
      aiFeedback: row.ai_feedback,
      loggedAt: row.logged_at,
      createdAt: row.created_at,
    }));

    set({ todaysMeals: meals, isLoading: false });
  },

  addMealLog: (meal) => {
    set((state) => ({
      todaysMeals: [...state.todaysMeals, meal],
    }));
  },

  setAnalyzing: (analyzing) => set({ isAnalyzing: analyzing }),

  getDailyTotals: () => {
    const meals = get().todaysMeals;
    return {
      calories: meals.reduce((sum, m) => sum + m.totalCalories, 0),
      protein: meals.reduce((sum, m) => sum + m.totalProteinG, 0),
      carbs: meals.reduce((sum, m) => sum + m.totalCarbsG, 0),
      fat: meals.reduce((sum, m) => sum + m.totalFatG, 0),
    };
  },
}));

export default useNutritionStore;
