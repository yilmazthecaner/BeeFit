/**
 * AI Coach Context Manager — "The Brain"
 *
 * This is the central intelligence of BeeFit. It orchestrates:
 *
 * 1. CONTEXT ASSEMBLY — Gathers relevant user data for the LLM:
 *    - User profile (goals, metrics, preferences)
 *    - Today's summary (workouts done, meals logged, calories remaining)
 *    - Relevant historical entries via vector similarity search (pgvector)
 *    - Conversation history with rolling summarization
 *
 * 2. CROSS-DOMAIN ANALYSIS — Connects fitness + nutrition data:
 *    e.g., "Heavy leg day + low protein → suggest protein-rich dinner"
 *
 * 3. PROMPT ENGINEERING — Builds structured system prompts that
 *    instruct the LLM to act as a professional health coach.
 *
 * 4. MEMORY MANAGEMENT — Manages the conversation window with
 *    automatic summarization when it grows too long.
 *
 * Architecture:
 *   Client ──► coachContextManager.sendMessage(msg)
 *     │
 *     ├── Fetches user profile from Supabase
 *     ├── Fetches today's workout + nutrition logs
 *     ├── Generates embedding for the user's query
 *     ├── Retrieves top-K similar context entries (pgvector)
 *     ├── Assembles the full context window
 *     ├── Calls GPT-4o with assembled context
 *     ├── Stores the assistant response
 *     └── Returns the coach's reply + suggestions
 */

import supabase from '../supabase/client';
import Config from '../../constants/config';
import type { UserProfile } from '../../types/user';
import type { WorkoutLog } from '../../types/workout';
import type { MealLog } from '../../types/nutrition';
import type {
  CoachMessage,
  CoachConversation,
  AIContextEntry,
  AssembledContext,
  CoachQueryResponse,
} from '../../types/coach';

// ════════════════════════════════════════
// SYSTEM PROMPT — The Coach's Personality
// ════════════════════════════════════════

const SYSTEM_PROMPT = `You are BeeFit Coach — a friendly, knowledgeable, and proactive AI health coach.

PERSONALITY:
- Warm and encouraging, like a supportive personal trainer
- Evidence-based advice grounded in sports science and nutrition
- Concise but thorough — give actionable recommendations
- Celebrate wins, gently course-correct when needed

CAPABILITIES:
- Analyze workout performance and suggest improvements
- Review meal choices and provide nutritional feedback
- Create cross-domain insights (fitness ↔ nutrition connections)
- Generate personalized workout plans based on goals and equipment
- Adjust recommendations based on energy expenditure

RULES:
- Never provide medical diagnoses or replace professional medical advice
- Always frame suggestions as recommendations, not prescriptions
- Reference specific data points from the user's logs when giving advice
- If data is insufficient, ask clarifying questions
- Keep responses concise — max 3-4 paragraphs unless explaining a plan`;

export class CoachContextManager {
  private userId: string;
  private conversationId: string | null = null;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ════════════════════════════════════════
  // PUBLIC API
  // ════════════════════════════════════════

  /**
   * Send a message to the AI Coach and receive a contextual reply.
   *
   * Flow:
   * 1. Load user profile
   * 2. Generate today's activity summary
   * 3. Embed the query and retrieve relevant history
   * 4. Assemble the full context window
   * 5. Call GPT-4o
   * 6. Store the conversation turn
   * 7. Return the response
   */
  async sendMessage(message: string): Promise<CoachQueryResponse> {
    try {
      // Step 1: Gather all context in parallel
      const [userProfile, todayWorkouts, todayMeals, relevantHistory] =
        await Promise.all([
          this.fetchUserProfile(),
          this.fetchTodaysWorkouts(),
          this.fetchTodaysMeals(),
          this.retrieveRelevantContext(message),
        ]);

      // Step 2: Load or create conversation
      const conversation = await this.getOrCreateConversation();

      // Step 3: Assemble the context window
      const context = this.assembleContext(
        userProfile,
        todayWorkouts,
        todayMeals,
        relevantHistory,
        conversation.messages
      );

      // Step 4: Call the LLM via Supabase Edge Function
      const reply = await this.callCoachLLM(context, message);

      // Step 5: Store the conversation turn
      await this.storeConversationTurn(conversation.id, message, reply);

      // Step 6: Store context entry for future retrieval
      await this.storeContextEntry(message, reply);

      return {
        reply,
        conversationId: conversation.id,
        contextUsed: relevantHistory.map((h) => h.id),
        suggestions: this.generateQuickReplies(userProfile, todayWorkouts, todayMeals),
      };
    } catch (error) {
      console.error('[CoachContextManager] Error:', error);
      throw new Error('Failed to get coach response. Please try again.');
    }
  }

  /**
   * Get a proactive daily briefing from the coach.
   * Called when the user opens the app.
   */
  async getDailyBriefing(): Promise<string> {
    const [userProfile, todayWorkouts, todayMeals] = await Promise.all([
      this.fetchUserProfile(),
      this.fetchTodaysWorkouts(),
      this.fetchTodaysMeals(),
    ]);

    const briefingPrompt = this.buildDailyBriefingPrompt(
      userProfile,
      todayWorkouts,
      todayMeals
    );

    // Call LLM for briefing
    const context: AssembledContext = {
      systemPrompt: SYSTEM_PROMPT,
      userProfile: this.formatUserProfile(userProfile),
      todaysSummary: this.buildTodaySummary(todayWorkouts, todayMeals, userProfile),
      relevantHistory: [],
      conversationHistory: [],
    };

    return this.callCoachLLM(context, briefingPrompt);
  }

  // ════════════════════════════════════════
  // DATA FETCHING
  // ════════════════════════════════════════

  private async fetchUserProfile(): Promise<UserProfile> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', this.userId)
      .single();

    if (error) throw new Error(`Failed to fetch user profile: ${error.message}`);
    return this.mapUserRow(data);
  }

  private async fetchTodaysWorkouts(): Promise<WorkoutLog[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', this.userId)
      .gte('logged_at', todayStart.toISOString())
      .order('logged_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch workouts: ${error.message}`);
    return (data ?? []).map(this.mapWorkoutRow);
  }

  private async fetchTodaysMeals(): Promise<MealLog[]> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data, error } = await supabase
      .from('meal_logs')
      .select('*, meal_items(*)')
      .eq('user_id', this.userId)
      .gte('logged_at', todayStart.toISOString())
      .order('logged_at', { ascending: false });

    if (error) throw new Error(`Failed to fetch meals: ${error.message}`);
    return (data ?? []).map(this.mapMealRow);
  }

  // ════════════════════════════════════════
  // VECTOR SEARCH (RAG)
  // ════════════════════════════════════════

  /**
   * Retrieve relevant historical context using vector similarity search.
   *
   * 1. Generate an embedding for the user's message
   * 2. Query pgvector for the top-K most similar context entries
   * 3. Return the matched entries
   */
  private async retrieveRelevantContext(
    query: string
  ): Promise<AIContextEntry[]> {
    try {
      // Call Supabase Edge Function to generate embedding + search
      const { data, error } = await supabase.functions.invoke(
        'search-context',
        {
          body: {
            userId: this.userId,
            query,
            topK: Config.MAX_CONTEXT_ENTRIES,
          },
        }
      );

      if (error) {
        console.warn('[RAG] Context retrieval failed, proceeding without history:', error);
        return [];
      }

      return data?.entries ?? [];
    } catch {
      // Gracefully degrade — the coach can still work without history
      console.warn('[RAG] Context retrieval failed, proceeding without history');
      return [];
    }
  }

  // ════════════════════════════════════════
  // CONTEXT ASSEMBLY
  // ════════════════════════════════════════

  /**
   * Assemble the complete context window for the LLM.
   *
   * Structure:
   *   [System Prompt]
   *   [User Profile Summary]
   *   [Today's Activity Summary]
   *   [Relevant Historical Context (from RAG)]
   *   [Conversation History]
   *   [User's Current Message]
   */
  private assembleContext(
    profile: UserProfile,
    todayWorkouts: WorkoutLog[],
    todayMeals: MealLog[],
    relevantHistory: AIContextEntry[],
    conversationHistory: CoachMessage[]
  ): AssembledContext {
    return {
      systemPrompt: SYSTEM_PROMPT,
      userProfile: this.formatUserProfile(profile),
      todaysSummary: this.buildTodaySummary(todayWorkouts, todayMeals, profile),
      relevantHistory: relevantHistory.map((entry) => entry.content),
      conversationHistory: this.trimConversationHistory(conversationHistory),
    };
  }

  private formatUserProfile(profile: UserProfile): string {
    return [
      `USER PROFILE:`,
      `Name: ${profile.displayName}`,
      profile.gender ? `Gender: ${profile.gender}` : null,
      profile.heightCm ? `Height: ${profile.heightCm} cm` : null,
      profile.weightKg ? `Weight: ${profile.weightKg} kg` : null,
      profile.fitnessGoal ? `Goal: ${profile.fitnessGoal.replace('_', ' ')}` : null,
      profile.activityLevel ? `Activity Level: ${profile.activityLevel.replace('_', ' ')}` : null,
      profile.dailyCalorieTarget ? `Daily Calorie Target: ${profile.dailyCalorieTarget} kcal` : null,
      profile.dailyProteinG ? `Protein Target: ${profile.dailyProteinG}g` : null,
      profile.dailyCarbsG ? `Carbs Target: ${profile.dailyCarbsG}g` : null,
      profile.dailyFatG ? `Fat Target: ${profile.dailyFatG}g` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  private buildTodaySummary(
    workouts: WorkoutLog[],
    meals: MealLog[],
    profile: UserProfile
  ): string {
    const totalCaloriesBurned = workouts.reduce(
      (sum, w) => sum + (w.caloriesBurned ?? 0),
      0
    );
    const totalCaloriesConsumed = meals.reduce(
      (sum, m) => sum + m.totalCalories,
      0
    );
    const totalProtein = meals.reduce((sum, m) => sum + m.totalProteinG, 0);
    const totalCarbs = meals.reduce((sum, m) => sum + m.totalCarbsG, 0);
    const totalFat = meals.reduce((sum, m) => sum + m.totalFatG, 0);

    const caloriesRemaining =
      (profile.dailyCalorieTarget ?? 2000) - totalCaloriesConsumed + totalCaloriesBurned;

    const lines = [
      `TODAY'S SUMMARY (${new Date().toLocaleDateString()}):`,
      ``,
      `🏋️ Workouts: ${workouts.length} completed`,
    ];

    workouts.forEach((w) => {
      lines.push(
        `  - ${w.title ?? w.workoutType}: ${w.durationMinutes ?? '?'} min, ${w.caloriesBurned ?? '?'} kcal burned`
      );
    });

    lines.push(
      ``,
      `🍽️ Meals logged: ${meals.length}`,
      `  Calories consumed: ${totalCaloriesConsumed} kcal`,
      `  Protein: ${totalProtein.toFixed(0)}g / ${profile.dailyProteinG ?? '?'}g target`,
      `  Carbs: ${totalCarbs.toFixed(0)}g / ${profile.dailyCarbsG ?? '?'}g target`,
      `  Fat: ${totalFat.toFixed(0)}g / ${profile.dailyFatG ?? '?'}g target`,
      ``,
      `📊 Calories burned from exercise: ${totalCaloriesBurned} kcal`,
      `📊 Net calories remaining: ~${caloriesRemaining} kcal`
    );

    return lines.join('\n');
  }

  // ════════════════════════════════════════
  // LLM CALL
  // ════════════════════════════════════════

  /**
   * Call GPT-4o via Supabase Edge Function.
   *
   * The edge function handles:
   * - API key management (server-side)
   * - Rate limiting
   * - Response streaming (optional)
   */
  private async callCoachLLM(
    context: AssembledContext,
    userMessage: string
  ): Promise<string> {
    const messages = [
      { role: 'system' as const, content: context.systemPrompt },
      {
        role: 'system' as const,
        content: [
          context.userProfile,
          '',
          context.todaysSummary,
          '',
          context.relevantHistory.length > 0
            ? `RELEVANT HISTORY:\n${context.relevantHistory.join('\n---\n')}`
            : '',
        ].join('\n'),
      },
      ...context.conversationHistory.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      { role: 'user' as const, content: userMessage },
    ];

    const { data, error } = await supabase.functions.invoke('coach-chat', {
      body: {
        messages,
        model: Config.AI_MODEL,
      },
    });

    if (error) throw new Error(`Coach LLM call failed: ${error.message}`);
    return data?.reply ?? 'I apologize, but I couldn\'t generate a response. Please try again.';
  }

  // ════════════════════════════════════════
  // CONVERSATION MANAGEMENT
  // ════════════════════════════════════════

  private async getOrCreateConversation(): Promise<CoachConversation> {
    if (this.conversationId) {
      const { data } = await supabase
        .from('coach_conversations')
        .select('*')
        .eq('id', this.conversationId)
        .single();

      if (data) return this.mapConversationRow(data);
    }

    // Create new conversation
    const { data, error } = await supabase
      .from('coach_conversations')
      .insert({ user_id: this.userId, messages: [] })
      .select()
      .single();

    if (error) throw new Error(`Failed to create conversation: ${error.message}`);

    this.conversationId = data.id;
    return this.mapConversationRow(data);
  }

  private async storeConversationTurn(
    conversationId: string,
    userMessage: string,
    assistantReply: string
  ): Promise<void> {
    const now = new Date().toISOString();

    const { data: current } = await supabase
      .from('coach_conversations')
      .select('messages')
      .eq('id', conversationId)
      .single();

    const messages = current?.messages ?? [];
    messages.push(
      { role: 'user', content: userMessage, timestamp: now },
      { role: 'assistant', content: assistantReply, timestamp: now }
    );

    // Summarize if conversation is getting long
    let summary: string | undefined;
    if (messages.length >= Config.CONVERSATION_SUMMARY_THRESHOLD * 2) {
      summary = await this.summarizeConversation(messages);
    }

    await supabase
      .from('coach_conversations')
      .update({
        messages,
        summary,
        updated_at: now,
      })
      .eq('id', conversationId);
  }

  /**
   * Summarize a long conversation to fit in the context window.
   * Keeps the last few messages intact + summary of older ones.
   */
  private async summarizeConversation(
    messages: CoachMessage[]
  ): Promise<string> {
    const olderMessages = messages.slice(0, -6); // Keep last 3 turns
    const { data } = await supabase.functions.invoke('coach-chat', {
      body: {
        messages: [
          {
            role: 'system',
            content:
              'Summarize this health coaching conversation in 2-3 sentences, capturing key topics, goals discussed, and any commitments made.',
          },
          {
            role: 'user',
            content: olderMessages
              .map((m) => `${m.role}: ${m.content}`)
              .join('\n'),
          },
        ],
        model: Config.AI_MODEL,
      },
    });

    return data?.reply ?? '';
  }

  private trimConversationHistory(
    messages: CoachMessage[]
  ): CoachMessage[] {
    // Keep last 10 messages to fit context window
    return messages.slice(-10);
  }

  // ════════════════════════════════════════
  // CONTEXT STORAGE
  // ════════════════════════════════════════

  private async storeContextEntry(
    userMessage: string,
    assistantReply: string
  ): Promise<void> {
    const content = `User asked: ${userMessage}\nCoach replied: ${assistantReply.substring(0, 200)}`;

    // Store via edge function which will also generate the embedding
    await supabase.functions.invoke('store-context', {
      body: {
        userId: this.userId,
        entryType: 'coach_note',
        content,
        sourceTable: 'coach_conversations',
        sourceId: this.conversationId,
      },
    });
  }

  // ════════════════════════════════════════
  // QUICK REPLIES
  // ════════════════════════════════════════

  private generateQuickReplies(
    profile: UserProfile,
    todayWorkouts: WorkoutLog[],
    todayMeals: MealLog[]
  ): string[] {
    const suggestions: string[] = [];

    if (todayWorkouts.length === 0) {
      suggestions.push("What's my workout for today?");
    }

    if (todayMeals.length === 0) {
      suggestions.push('What should I eat for breakfast?');
    }

    const totalProtein = todayMeals.reduce(
      (sum, m) => sum + m.totalProteinG,
      0
    );
    if (
      profile.dailyProteinG &&
      totalProtein < profile.dailyProteinG * 0.5 &&
      todayMeals.length >= 2
    ) {
      suggestions.push('How can I hit my protein target today?');
    }

    if (todayWorkouts.length > 0) {
      suggestions.push('How did my workout go today?');
    }

    suggestions.push('Show me my weekly progress');

    return suggestions.slice(0, 3);
  }

  // ════════════════════════════════════════
  // DAILY BRIEFING
  // ════════════════════════════════════════

  private buildDailyBriefingPrompt(
    profile: UserProfile,
    todayWorkouts: WorkoutLog[],
    todayMeals: MealLog[]
  ): string {
    const timeOfDay = new Date().getHours();
    const greeting =
      timeOfDay < 12 ? 'morning' : timeOfDay < 17 ? 'afternoon' : 'evening';

    return `Generate a friendly, concise ${greeting} briefing for ${profile.displayName}. 
Include:
1. A warm greeting
2. Today's key focus based on their ${profile.fitnessGoal ?? 'general'} goal
3. ${todayWorkouts.length > 0 ? 'Acknowledge their workout(s) today' : 'Suggest when to fit in a workout'}
4. ${todayMeals.length > 0 ? 'Quick nutrition check-in' : 'A meal suggestion for their next meal'}
5. One motivational insight

Keep it under 4 sentences. Be specific, not generic.`;
  }

  // ════════════════════════════════════════
  // DATA MAPPERS (DB → TypeScript)
  // ════════════════════════════════════════

  /* eslint-disable @typescript-eslint/no-explicit-any */
  private mapUserRow(row: any): UserProfile {
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

  private mapWorkoutRow(row: any): WorkoutLog {
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

  private mapMealRow(row: any): MealLog {
    return {
      id: row.id,
      userId: row.user_id,
      mealType: row.meal_type,
      photoUrl: row.photo_url,
      totalCalories: row.total_calories,
      totalProteinG: row.total_protein_g,
      totalCarbsG: row.total_carbs_g,
      totalFatG: row.total_fat_g,
      totalFiberG: row.total_fiber_g,
      items: row.meal_items ?? [],
      aiAnalysis: row.ai_analysis,
      aiFeedback: row.ai_feedback,
      loggedAt: row.logged_at,
      createdAt: row.created_at,
    };
  }

  private mapConversationRow(row: any): CoachConversation {
    return {
      id: row.id,
      userId: row.user_id,
      messages: row.messages ?? [],
      summary: row.summary,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export default CoachContextManager;
