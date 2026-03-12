/**
 * User Type Definitions
 */

export type Gender = 'male' | 'female' | 'other';

export type FitnessGoal =
  | 'lose_weight'
  | 'build_muscle'
  | 'maintain'
  | 'endurance'
  | 'general';

export type ActivityLevel =
  | 'sedentary'
  | 'light'
  | 'moderate'
  | 'active'
  | 'very_active';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  dateOfBirth?: string;       // ISO date string
  gender?: Gender;
  heightCm?: number;
  weightKg?: number;
  fitnessGoal?: FitnessGoal;
  activityLevel?: ActivityLevel;
  dailyCalorieTarget?: number;
  dailyProteinG?: number;
  dailyCarbsG?: number;
  dailyFatG?: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserMacroTargets {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}
