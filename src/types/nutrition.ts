/**
 * Nutrition & Meal Type Definitions
 */

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ── Individual food item detected by Vision AI ──
export interface MealItem {
  id: string;
  mealId: string;
  foodName: string;
  portionSize?: string;       // e.g., "1 cup", "150g", "2 slices"
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  confidence: number;         // 0.00–1.00 from vision model
}

// ── Complete meal log entry ──
export interface MealLog {
  id: string;
  userId: string;
  mealType: MealType;
  photoUrl?: string;
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  totalFiberG?: number;
  items: MealItem[];
  aiAnalysis?: VisionAnalysisResult;
  aiFeedback?: string;        // coach commentary on this meal
  loggedAt: string;
  createdAt: string;
}

// ── Response from the Vision API analysis ──
export interface VisionAnalysisResult {
  items: VisionFoodItem[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  confidence: number;          // overall confidence
  rawResponse?: string;        // raw model output for debugging
}

export interface VisionFoodItem {
  name: string;
  portion: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG?: number;
  confidence: number;
}

// ── Daily nutrition summary ──
export interface DailyNutritionSummary {
  date: string;               // ISO date
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
  mealCount: number;
  meals: MealLog[];
  calorieTarget: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
}
