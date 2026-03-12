/**
 * Wearable Sync Service
 *
 * Orchestrates the full pipeline from wearable → database → AI context:
 *
 * 1. Fetch new workouts from HealthKit (or Health Connect)
 * 2. Filter out already-synced workouts (by external ID)
 * 3. Store new workouts in the database
 * 4. Generate AI context entries for each new workout
 * 5. Update the fitness store
 *
 * This service is called:
 * - On app launch (to catch up on any missed workouts)
 * - On a periodic interval (every 15 minutes)
 * - When a HealthKit background delivery fires
 */

import HealthKitService from '../health/healthKitService';
import supabase from '../supabase/client';
import { useFitnessStore } from '../../stores/useFitnessStore';
import type { WorkoutLog } from '../../types/workout';

export class WearableSyncService {
  private healthKit: HealthKitService;
  private userId: string;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;

  constructor(userId: string) {
    this.userId = userId;
    this.healthKit = new HealthKitService();
  }

  // ════════════════════════════════════════
  // INITIALIZATION
  // ════════════════════════════════════════

  /**
   * Initialize HealthKit and set up background sync.
   */
  async initialize(): Promise<boolean> {
    const granted = await this.healthKit.initialize();
    if (!granted) return false;

    // Set up background delivery
    await this.healthKit.enableBackgroundDelivery(async (workouts) => {
      console.log(
        `[WearableSync] Background delivery: ${workouts.length} new workouts`
      );
      await this.syncWorkouts();
    });

    // Do an initial sync
    await this.syncWorkouts();

    return true;
  }

  /**
   * Start periodic sync (call on app foreground).
   */
  startPeriodicSync(intervalMs: number = 15 * 60 * 1000): void {
    this.stopPeriodicSync();
    this.syncIntervalId = setInterval(() => {
      this.syncWorkouts();
    }, intervalMs);
  }

  /**
   * Stop periodic sync (call on app background).
   */
  stopPeriodicSync(): void {
    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  // ════════════════════════════════════════
  // SYNC PIPELINE
  // ════════════════════════════════════════

  /**
   * Full sync pipeline:
   * HealthKit → Filter → Store → AI Context → Update Store
   */
  async syncWorkouts(): Promise<number> {
    const store = useFitnessStore.getState();
    store.setSyncing(true);

    try {
      // 1. Fetch today's workouts from HealthKit
      const hkWorkouts = await this.healthKit.getTodaysWorkouts();
      if (hkWorkouts.length === 0) {
        store.setSyncing(false);
        return 0;
      }

      // 2. Get already-synced external IDs
      const { data: existing } = await supabase
        .from('workout_logs')
        .select('external_id')
        .eq('user_id', this.userId)
        .eq('source', 'healthkit')
        .not('external_id', 'is', null);

      const syncedIds = new Set(
        (existing ?? []).map((row) => row.external_id)
      );

      // 3. Filter to new workouts only
      const newWorkouts = hkWorkouts.filter(
        (w) => !syncedIds.has(w.id)
      );

      if (newWorkouts.length === 0) {
        store.setSyncing(false);
        return 0;
      }

      // 4. Format for BeeFit schema
      const formatted = await this.healthKit.formatForBeeFit(newWorkouts);

      // 5. Store each workout and generate context
      let syncCount = 0;
      for (const workout of formatted) {
        const fullWorkout: Omit<WorkoutLog, 'id' | 'createdAt'> = {
          ...workout,
          userId: this.userId,
        };

        await store.addWorkoutLog(fullWorkout);

        // Generate AI context entry
        await this.createContextEntry(fullWorkout);
        syncCount++;
      }

      // 6. Update the store
      store.setLastSync(new Date().toISOString());
      await store.fetchTodaysWorkouts(this.userId);

      console.log(`[WearableSync] Synced ${syncCount} new workouts`);
      return syncCount;
    } catch (error) {
      console.error('[WearableSync] Sync failed:', error);
      return 0;
    } finally {
      store.setSyncing(false);
    }
  }

  // ════════════════════════════════════════
  // AI CONTEXT
  // ════════════════════════════════════════

  /**
   * Create an AI context entry for a synced workout.
   * This makes the workout discoverable by the AI Coach via RAG.
   */
  private async createContextEntry(
    workout: Omit<WorkoutLog, 'id' | 'createdAt'>
  ): Promise<void> {
    const content = [
      `Workout synced from Apple Watch:`,
      `Type: ${workout.title ?? workout.workoutType}`,
      `Duration: ${workout.durationMinutes ?? 'unknown'} minutes`,
      workout.caloriesBurned
        ? `Calories burned: ${workout.caloriesBurned} kcal`
        : null,
      workout.avgHeartRate
        ? `Avg heart rate: ${workout.avgHeartRate} bpm`
        : null,
      workout.maxHeartRate
        ? `Max heart rate: ${workout.maxHeartRate} bpm`
        : null,
      `Time: ${new Date(workout.loggedAt).toLocaleString()}`,
    ]
      .filter(Boolean)
      .join('\n');

    await supabase.functions.invoke('store-context', {
      body: {
        userId: this.userId,
        entryType: 'wearable_sync',
        content,
        sourceTable: 'workout_logs',
        metadata: {
          workoutType: workout.workoutType,
          caloriesBurned: workout.caloriesBurned,
          durationMinutes: workout.durationMinutes,
        },
      },
    });
  }

  // ════════════════════════════════════════
  // CLEANUP
  // ════════════════════════════════════════

  destroy(): void {
    this.stopPeriodicSync();
  }
}

export default WearableSyncService;
