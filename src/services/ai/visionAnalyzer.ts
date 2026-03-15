/**
 * Vision Analyzer — Photo-to-Calorie Pipeline
 *
 * Processes meal photos through GPT-4o Vision to:
 * 1. Upload the photo to Supabase Storage
 * 2. Send the image to the Vision model for analysis
 * 3. Parse identified food items with portion sizes and macros
 * 4. Store the complete meal log with nutritional breakdown
 * 5. Trigger AI Coach feedback on the meal
 *
 * The structured prompt engineering ensures consistent JSON output
 * with food names, estimated portions, and per-item macronutrients.
 */

import supabase from '../supabase/client';
import Config from '../../constants/config';
import type {
  MealType,
  MealLog,
  VisionAnalysisResult,
  VisionFoodItem,
} from '../../types/nutrition';

// ════════════════════════════════════════
// VISION ANALYSIS PROMPT
// ════════════════════════════════════════

const VISION_ANALYSIS_PROMPT = `You are a professional nutritionist with expertise in food identification and portion estimation.

Analyze this meal photo and provide a detailed nutritional breakdown.

INSTRUCTIONS:
1. Identify ALL visible food items in the photo
2. Estimate the portion size for each item (use common measurements: cups, grams, pieces, slices)
3. Calculate the calories and macronutrients for each item
4. Provide a confidence score (0.0 to 1.0) for each identification

RESPOND IN THIS EXACT JSON FORMAT:
{
  "items": [
    {
      "name": "food item name",
      "portion": "estimated portion size",
      "calories": 0,
      "proteinG": 0.0,
      "carbsG": 0.0,
      "fatG": 0.0,
      "fiberG": 0.0,
      "confidence": 0.0
    }
  ],
  "totalCalories": 0,
  "totalProteinG": 0.0,
  "totalCarbsG": 0.0,
  "totalFatG": 0.0,
  "confidence": 0.0
}

IMPORTANT:
- Be precise with calorie estimations based on standard nutritional databases
- If a food item is partially visible or unclear, lower the confidence score
- Round calories to nearest whole number, macros to 1 decimal place
- Only return valid JSON, no additional text`;

export class VisionAnalyzer {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════

  /**
   * Full pipeline: photo → upload → analyze → store → feedback
   *
   * @param imageUri - Local file URI from camera/gallery
   * @param mealType - breakfast, lunch, dinner, or snack
   * @returns Complete meal log with AI analysis and coach feedback
   */
  async analyzeAndLogMeal(
    imageUri: string,
    mealType: MealType
  ): Promise<MealLog> {
    try {
      // Step 1: Upload photo to Supabase Storage
      const photoUrl = await this.uploadMealPhoto(imageUri);

      // Step 2: Analyze with Vision AI
      const analysis = await this.analyzeImage(photoUrl);

      // Step 3: Store the meal log
      const mealLog = await this.storeMealLog(
        mealType,
        photoUrl,
        analysis
      );

      // Step 4: Get AI Coach feedback on this meal
      const feedback = await this.getCoachFeedback(mealLog);

      // Step 5: Update the meal log with feedback
      await this.updateMealFeedback(mealLog.id, feedback);

      return {
        ...mealLog,
        aiFeedback: feedback,
      };
    } catch (error) {
      console.error('[VisionAnalyzer] Pipeline error:', error);
      throw new Error('Failed to analyze meal. Please try again.');
    }
  }

  // ════════════════════════════════════════
  // PHOTO UPLOAD
  // ════════════════════════════════════════

  /**
   * Upload a meal photo to Supabase Storage.
   *
   * Generates a unique path per user and timestamp:
   *   meals/{userId}/{timestamp}.jpg
   */
  private async uploadMealPhoto(imageUri: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `meals/${this.userId}/${timestamp}.jpg`;

    // Convert the local URI to a blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from('meal-photos')
      .upload(fileName, blob, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Photo upload failed: ${uploadError.message}`);
    }

    // Get the public URL
    const { data } = supabase.storage
      .from('meal-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  }

  // ════════════════════════════════════════
  // VISION ANALYSIS
  // ════════════════════════════════════════

  /**
   * Send the meal photo to GPT-4o Vision via Supabase Edge Function.
   *
   * The edge function handles:
   * - API key management (server-side)
   * - Image URL validation
   * - Response parsing + validation
   */
  private async analyzeImage(
    photoUrl: string
  ): Promise<VisionAnalysisResult> {
    const { data, error } = await supabase.functions.invoke('analyze-meal', {
      body: {
        photoUrl,
        prompt: VISION_ANALYSIS_PROMPT,
        model: Config.AI_VISION_MODEL,
      },
    });

    if (error) {
      throw new Error(`Vision analysis failed: ${error.message}`);
    }

    return this.parseVisionResponse(data?.analysis);
  }

  /**
   * Parse and validate the Vision API response.
   *
   * Handles edge cases:
   * - Malformed JSON
   * - Missing fields
   * - Unreasonable calorie values
   */
  private parseVisionResponse(rawResponse: unknown): VisionAnalysisResult {
    if (!rawResponse || typeof rawResponse !== 'object') {
      throw new Error('Invalid vision response format');
    }

    const response = rawResponse as Record<string, unknown>;

    const items: VisionFoodItem[] = Array.isArray(response.items)
      ? response.items.map((item: Record<string, unknown>) => ({
          name: String(item.name ?? 'Unknown food'),
          portion: String(item.portion ?? 'unknown'),
          calories: this.clampNumber(Number(item.calories ?? 0), 0, 5000),
          proteinG: this.clampNumber(Number(item.proteinG ?? 0), 0, 500),
          carbsG: this.clampNumber(Number(item.carbsG ?? 0), 0, 500),
          fatG: this.clampNumber(Number(item.fatG ?? 0), 0, 500),
          fiberG: this.clampNumber(Number(item.fiberG ?? 0), 0, 100),
          confidence: this.clampNumber(Number(item.confidence ?? 0.5), 0, 1),
        }))
      : [];

    // Recalculate totals from items (more reliable than trusting the model's totals)
    const totalCalories = items.reduce((sum, i) => sum + i.calories, 0);
    const totalProteinG = items.reduce((sum, i) => sum + i.proteinG, 0);
    const totalCarbsG = items.reduce((sum, i) => sum + i.carbsG, 0);
    const totalFatG = items.reduce((sum, i) => sum + i.fatG, 0);
    const avgConfidence =
      items.length > 0
        ? items.reduce((sum, i) => sum + i.confidence, 0) / items.length
        : 0;

    return {
      items,
      totalCalories,
      totalProteinG: Math.round(totalProteinG * 10) / 10,
      totalCarbsG: Math.round(totalCarbsG * 10) / 10,
      totalFatG: Math.round(totalFatG * 10) / 10,
      confidence: Math.round(avgConfidence * 100) / 100,
      rawResponse: JSON.stringify(rawResponse),
    };
  }

  // ════════════════════════════════════════
  // DATABASE STORAGE
  // ════════════════════════════════════════

  /**
   * Store the analyzed meal in the database.
   *
   * Creates:
   * 1. A `meal_logs` row with totals
   * 2. Individual `meal_items` rows for each food item
   * 3. An `ai_context_entries` row for future RAG retrieval
   */
  private async storeMealLog(
    mealType: MealType,
    photoUrl: string,
    analysis: VisionAnalysisResult
  ): Promise<MealLog> {
    const now = new Date().toISOString();

    // Insert the meal log
    const { data: mealRow, error: mealError } = await supabase
      .from('meal_logs')
      .insert({
        user_id: this.userId,
        meal_type: mealType,
        photo_url: photoUrl,
        total_calories: analysis.totalCalories,
        total_protein_g: analysis.totalProteinG,
        total_carbs_g: analysis.totalCarbsG,
        total_fat_g: analysis.totalFatG,
        ai_analysis: analysis,
        logged_at: now,
      })
      .select()
      .single();

    if (mealError) {
      throw new Error(`Failed to store meal log: ${mealError.message}`);
    }

    // Insert individual food items
    if (analysis.items.length > 0) {
      const mealItems = analysis.items.map((item) => ({
        meal_id: mealRow.id,
        food_name: item.name,
        portion_size: item.portion,
        calories: item.calories,
        protein_g: item.proteinG,
        carbs_g: item.carbsG,
        fat_g: item.fatG,
        fiber_g: item.fiberG,
        confidence: item.confidence,
      }));

      await supabase.from('meal_items').insert(mealItems);
    }

    // Create a context entry for RAG
    const contextContent = this.buildMealContextEntry(mealType, analysis);
    await supabase.functions.invoke('store-context', {
      body: {
        userId: this.userId,
        entryType: 'meal',
        content: contextContent,
        sourceTable: 'meal_logs',
        sourceId: mealRow.id,
      },
    });

    return {
      id: mealRow.id,
      userId: this.userId,
      mealType,
      photoUrl,
      totalCalories: analysis.totalCalories,
      totalProteinG: analysis.totalProteinG,
      totalCarbsG: analysis.totalCarbsG,
      totalFatG: analysis.totalFatG,
      items: analysis.items.map((item, index) => ({
        id: `temp-${index}`,
        mealId: mealRow.id,
        foodName: item.name,
        portionSize: item.portion,
        calories: item.calories,
        proteinG: item.proteinG,
        carbsG: item.carbsG,
        fatG: item.fatG,
        fiberG: item.fiberG,
        confidence: item.confidence,
      })),
      aiAnalysis: analysis,
      loggedAt: now,
      createdAt: mealRow.created_at,
    };
  }

  // ════════════════════════════════════════
  // COACH FEEDBACK
  // ════════════════════════════════════════

  /**
   * Get contextual feedback from the AI Coach about this meal.
   *
   * The coach considers:
   * - Daily macro progress (how much is left to eat)
   * - The user's fitness goal
   * - Workout activity today
   */
  private async getCoachFeedback(mealLog: MealLog): Promise<string> {
    const { data, error } = await supabase.functions.invoke('coach-chat', {
      body: {
        messages: [
          {
            role: 'system',
            content: `You are BeeFit Coach, an expert holistic Personal Trainer and Dietitian. Give a brief, constructive feedback (2-3 sentences) on a meal that was just logged. Evaluate the meal's macros in the context of their overall fitness and recovery. If the meal supports their physical activity and goals, be encouraging. If it lacks protein or has excessive calories, suggest modifications.`,
          },
          {
            role: 'user',
            content: `I just had ${mealLog.mealType}: ${mealLog.items.map((i) => `${i.foodName} (${i.portionSize})`).join(', ')}. Total: ${mealLog.totalCalories} kcal, ${mealLog.totalProteinG}g protein, ${mealLog.totalCarbsG}g carbs, ${mealLog.totalFatG}g fat.`,
          },
        ],
        model: Config.AI_MODEL,
      },
    });

    if (error) {
      console.warn('[VisionAnalyzer] Coach feedback failed:', error);
      return '';
    }

    return data?.reply ?? '';
  }

  private async updateMealFeedback(
    mealId: string,
    feedback: string
  ): Promise<void> {
    if (!feedback) return;

    await supabase
      .from('meal_logs')
      .update({ ai_feedback: feedback })
      .eq('id', mealId);
  }

  // ════════════════════════════════════════
  // HELPERS
  // ════════════════════════════════════════

  private buildMealContextEntry(
    mealType: MealType,
    analysis: VisionAnalysisResult
  ): string {
    const itemsList = analysis.items
      .map((i) => `${i.name} (${i.portion}): ${i.calories} kcal`)
      .join(', ');

    return `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} logged: ${itemsList}. Total: ${analysis.totalCalories} kcal, ${analysis.totalProteinG}g protein, ${analysis.totalCarbsG}g carbs, ${analysis.totalFatG}g fat.`;
  }

  private clampNumber(value: number, min: number, max: number): number {
    if (isNaN(value)) return min;
    return Math.max(min, Math.min(max, value));
  }
}

export default VisionAnalyzer;
