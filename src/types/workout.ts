/**
 * Workout & Fitness Type Definitions
 */

export type WorkoutType =
  | 'strength'
  | 'cardio'
  | 'hiit'
  | 'yoga'
  | 'pilates'
  | 'swimming'
  | 'cycling'
  | 'running'
  | 'walking'
  | 'other';

export type PlanType = 'daily' | 'weekly' | 'monthly';

export type Equipment =
  | 'bodyweight'
  | 'dumbbells'
  | 'barbell'
  | 'kettlebell'
  | 'resistance_bands'
  | 'pull_up_bar'
  | 'bench'
  | 'cable_machine'
  | 'full_gym';

export type DataSource = 'healthkit' | 'health_connect' | 'manual';

// ── Exercise within a workout ──
export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  weightKg?: number;
  restSeconds?: number;
  durationSeconds?: number;  // for timed exercises
  notes?: string;
}

// ── Workout Plan (AI-generated or manual) ──
export interface WorkoutPlan {
  id: string;
  userId: string;
  title: string;
  planType: PlanType;
  goal?: string;
  equipment: Equipment[];
  generatedBy: 'ai' | 'manual';
  planData: WorkoutDay[];
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  createdAt: string;
}

export interface WorkoutDay {
  dayNumber: number;
  dayName: string;           // e.g., "Monday — Chest & Triceps"
  focus: string;             // e.g., "Upper Body Push"
  exercises: Exercise[];
  estimatedDurationMin: number;
  restDay: boolean;
}

// ── Workout Log (completed workout) ──
export interface WorkoutLog {
  id: string;
  userId: string;
  planId?: string;
  workoutType: WorkoutType;
  title?: string;
  durationMinutes?: number;
  caloriesBurned?: number;
  avgHeartRate?: number;
  maxHeartRate?: number;
  source: DataSource;
  externalId?: string;       // HealthKit workout identifier
  exercises?: Exercise[];
  notes?: string;
  loggedAt: string;
  createdAt: string;
}

// ── HealthKit Workout Sample ──
export interface HealthKitWorkoutSample {
  id: string;
  workoutType: string;
  startDate: string;
  endDate: string;
  durationMinutes: number;
  totalEnergyBurned?: number;
  totalDistance?: number;
  sourceName: string;
  sourceId: string;
  metadata?: Record<string, unknown>;
}

export interface HeartRateSample {
  timestamp: string;
  bpm: number;
}
