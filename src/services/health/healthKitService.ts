/**
 * Apple HealthKit Service
 *
 * Wraps react-native-health to provide:
 * 1. Permission management for health data types
 * 2. Workout data queries with date range filtering
 * 3. Heart rate and calorie sample retrieval
 * 4. Background delivery for automatic workout sync
 * 5. Data formatting into BeeFit's workout_logs schema
 *
 * NOTE: This module only works on iOS. For Android,
 * see healthConnectService.ts (Google Health Connect).
 *
 * SETUP REQUIRED:
 * - Install: npx expo install react-native-health
 * - Use the react-native-health config plugin to set HealthKit entitlements
 * - Provide NSHealthShareUsageDescription and NSHealthUpdateUsageDescription
 * - Build with Expo Dev Client (native module required)
 */

import { Platform } from 'react-native';
import type {
  WorkoutLog,
  WorkoutType,
  HealthKitWorkoutSample,
  HeartRateSample,
} from '../../types/workout';

// ════════════════════════════════════════
// TYPES
// ════════════════════════════════════════

interface HealthKitPermissions {
  read: string[];
  write: string[];
}

// ════════════════════════════════════════
// HEALTHKIT SERVICE
// ════════════════════════════════════════

export class HealthKitService {
  private isInitialized = false;

  // ── Permissions we need ──
  private readonly permissions: HealthKitPermissions = {
    read: [
      'Workout',
      'HeartRate',
      'ActiveEnergyBurned',
      'BasalEnergyBurned',
      'StepCount',
      'DistanceWalkingRunning',
      'DistanceCycling',
      'BodyMass',
      'Height',
    ],
    write: [], // We're read-only for now
  };

  // ════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════

  /**
   * Check if HealthKit is available and request permissions.
   *
   * @returns true if permissions were granted
   */
  async initialize(): Promise<boolean> {
    if (Platform.OS !== 'ios') {
      console.warn('[HealthKit] Not available on this platform');
      return false;
    }

    try {
      // Dynamic import — only loads on iOS
      const AppleHealthKit = await this.getHealthKitModule();
      if (!AppleHealthKit) return false;

      return new Promise((resolve) => {
        AppleHealthKit.initHealthKit(
          { permissions: this.permissions },
          (error: string | null) => {
            if (error) {
              console.error('[HealthKit] Init error:', error);
              resolve(false);
              return;
            }
            this.isInitialized = true;
            console.log('[HealthKit] Initialized successfully');
            resolve(true);
          }
        );
      });
    } catch (error) {
      console.error('[HealthKit] Module not available:', error);
      return false;
    }
  }

  /**
   * Check if the service is ready to use.
   */
  get isReady(): boolean {
    return Platform.OS === 'ios' && this.isInitialized;
  }

  // ════════════════════════════════════════
  // WORKOUT QUERIES
  // ════════════════════════════════════════

  /**
   * Fetch workouts from HealthKit within a date range.
   *
   * @param startDate - Start of the range
   * @param endDate - End of the range (defaults to now)
   * @returns Array of HealthKit workout samples
   */
  async getWorkouts(
    startDate: Date,
    endDate: Date = new Date()
  ): Promise<HealthKitWorkoutSample[]> {
    if (!this.isReady) {
      console.warn('[HealthKit] Not initialized');
      return [];
    }

    const AppleHealthKit = await this.getHealthKitModule();
    if (!AppleHealthKit) return [];

    return new Promise((resolve) => {
      AppleHealthKit.getSamples(
        {
          typeIdentifier: 'Workout',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
        (error: string | null, results: unknown[]) => {
          if (error) {
            console.error('[HealthKit] Workout query error:', error);
            resolve([]);
            return;
          }
          resolve(results.map(this.mapHealthKitWorkout));
        }
      );
    });
  }

  /**
   * Fetch today's workouts.
   */
  async getTodaysWorkouts(): Promise<HealthKitWorkoutSample[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    return this.getWorkouts(todayStart);
  }

  /**
   * Fetch this week's workouts.
   */
  async getThisWeeksWorkouts(): Promise<HealthKitWorkoutSample[]> {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    return this.getWorkouts(weekStart);
  }

  // ════════════════════════════════════════
  // HEART RATE
  // ════════════════════════════════════════

  /**
   * Fetch heart rate samples for a specific time range.
   * Useful for getting HR data during a specific workout.
   */
  async getHeartRateSamples(
    startDate: Date,
    endDate: Date
  ): Promise<HeartRateSample[]> {
    if (!this.isReady) return [];

    const AppleHealthKit = await this.getHealthKitModule();
    if (!AppleHealthKit) return [];

    return new Promise((resolve) => {
      AppleHealthKit.getHeartRateSamples(
        {
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          ascending: true,
        },
        (error: string | null, results: Array<{ value: number; startDate: string }>) => {
          if (error) {
            console.error('[HealthKit] Heart rate query error:', error);
            resolve([]);
            return;
          }
          resolve(
            results.map((sample) => ({
              timestamp: sample.startDate,
              bpm: Math.round(sample.value),
            }))
          );
        }
      );
    });
  }

  // ════════════════════════════════════════
  // ACTIVE CALORIES
  // ════════════════════════════════════════

  /**
   * Fetch total active calories burned today.
   */
  async getTodaysActiveCalories(): Promise<number> {
    if (!this.isReady) return 0;

    const AppleHealthKit = await this.getHealthKitModule();
    if (!AppleHealthKit) return 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return new Promise((resolve) => {
      AppleHealthKit.getActiveEnergyBurned(
        {
          startDate: todayStart.toISOString(),
          endDate: new Date().toISOString(),
        },
        (error: string | null, results: Array<{ value: number }>) => {
          if (error) {
            resolve(0);
            return;
          }
          const total = results.reduce(
            (sum, sample) => sum + (sample.value ?? 0),
            0
          );
          resolve(Math.round(total));
        }
      );
    });
  }

  // ════════════════════════════════════════
  // STEP COUNT
  // ════════════════════════════════════════

  /**
   * Fetch today's step count.
   */
  async getTodaysSteps(): Promise<number> {
    if (!this.isReady) return 0;

    const AppleHealthKit = await this.getHealthKitModule();
    if (!AppleHealthKit) return 0;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    return new Promise((resolve) => {
      AppleHealthKit.getStepCount(
        {
          startDate: todayStart.toISOString(),
          endDate: new Date().toISOString(),
        },
        (error: string | null, results: { value: number }) => {
          if (error) {
            resolve(0);
            return;
          }
          resolve(Math.round(results.value ?? 0));
        }
      );
    });
  }

  // ════════════════════════════════════════
  // FORMAT FOR BEEFIT
  // ════════════════════════════════════════

  /**
   * Convert HealthKit workout samples into BeeFit's WorkoutLog format.
   *
   * This is the bridge between Apple's data model and our schema.
   * The formatted data is ready to be:
   * 1. Stored in the workout_logs table
   * 2. Fed into the AI Coach's context
   */
  async formatForBeeFit(
    samples: HealthKitWorkoutSample[]
  ): Promise<Omit<WorkoutLog, 'id' | 'userId' | 'createdAt'>[]> {
    const formattedWorkouts = await Promise.all(
      samples.map(async (sample) => {
        // Get heart rate data for this specific workout's time range
        const heartRates = await this.getHeartRateSamples(
          new Date(sample.startDate),
          new Date(sample.endDate)
        );

        const avgHR =
          heartRates.length > 0
            ? Math.round(
                heartRates.reduce((sum, hr) => sum + hr.bpm, 0) /
                  heartRates.length
              )
            : undefined;

        const maxHR =
          heartRates.length > 0
            ? Math.max(...heartRates.map((hr) => hr.bpm))
            : undefined;

        return {
          workoutType: this.mapWorkoutType(sample.workoutType) as WorkoutType,
          title: this.formatWorkoutTitle(sample.workoutType),
          durationMinutes: Math.round(sample.durationMinutes),
          caloriesBurned: sample.totalEnergyBurned
            ? Math.round(sample.totalEnergyBurned)
            : undefined,
          avgHeartRate: avgHR,
          maxHeartRate: maxHR,
          source: 'healthkit' as const,
          externalId: sample.id,
          loggedAt: sample.startDate,
        };
      })
    );

    return formattedWorkouts;
  }

  // ════════════════════════════════════════
  // BACKGROUND SYNC
  // ════════════════════════════════════════

  /**
   * Set up background delivery to get notified when new workouts are added.
   *
   * NOTE: Background delivery requires:
   * - HealthKit Background Delivery capability in Xcode
   * - The app must register for background modes
   *
   * @param onNewWorkout - Callback when a new workout is detected
   */
  async enableBackgroundDelivery(
    onNewWorkout: (workouts: HealthKitWorkoutSample[]) => void
  ): Promise<void> {
    if (!this.isReady) return;

    const AppleHealthKit = await this.getHealthKitModule();
    if (!AppleHealthKit) return;

    // Set up an observer for new workout samples
    AppleHealthKit.enableBackgroundDelivery(
      'Workout',
      1, // frequency: 1 = immediate
      () => {
        // When background delivery fires, fetch the latest workouts
        this.getTodaysWorkouts().then(onNewWorkout);
      }
    );
  }

  // ════════════════════════════════════════
  // PRIVATE HELPERS
  // ════════════════════════════════════════

  /**
   * Dynamically import the HealthKit module.
   * Returns null if not available (e.g., on Android or in Expo Go).
   */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  private async getHealthKitModule(): Promise<any | null> {
    try {
      // react-native-health needs to be installed separately
      // This dynamic import prevents crashes on non-iOS platforms
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require('react-native-health');
      return module.default ?? module;
    } catch {
      return null;
    }
  }

  private mapHealthKitWorkout(raw: any): HealthKitWorkoutSample {
    return {
      id: raw.uuid ?? raw.id ?? String(Date.now()),
      workoutType: raw.activityType ?? raw.type ?? 'other',
      startDate: raw.startDate ?? raw.start,
      endDate: raw.endDate ?? raw.end,
      durationMinutes:
        raw.duration ??
        (new Date(raw.endDate).getTime() -
          new Date(raw.startDate).getTime()) /
          60000,
      totalEnergyBurned: raw.totalEnergyBurned ?? raw.calories,
      totalDistance: raw.totalDistance ?? raw.distance,
      sourceName: raw.sourceName ?? 'Unknown',
      sourceId: raw.sourceId ?? '',
      metadata: raw.metadata,
    };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  private mapWorkoutType(
    hkType: string
  ): string {
    const typeMap: Record<string, WorkoutLog['workoutType']> = {
      TraditionalStrengthTraining: 'strength',
      FunctionalStrengthTraining: 'strength',
      Running: 'running',
      Cycling: 'cycling',
      Swimming: 'swimming',
      Walking: 'walking',
      Yoga: 'yoga',
      HighIntensityIntervalTraining: 'hiit',
      Elliptical: 'cardio',
      Rowing: 'cardio',
      StairClimbing: 'cardio',
      CrossTraining: 'hiit',
    };

    return typeMap[hkType] ?? 'other';
  }

  private formatWorkoutTitle(hkType: string): string {
    // Convert PascalCase to human-readable
    return hkType
      .replace(/([A-Z])/g, ' $1')
      .trim()
      .replace(/^./, (str) => str.toUpperCase());
  }
}

export default HealthKitService;
