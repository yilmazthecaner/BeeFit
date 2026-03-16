/**
 * Supabase Edge Function — Generate Workout Plan
 *
 * Uses GPT-4o to generate personalized workout plans based on
 * user profile, goals, available equipment, and past performance.
 *
 * POST /generate-workout
 * Body: { userId: string, planType: 'daily'|'weekly'|'monthly', equipment: string[] }
 * Response: { plan: WorkoutPlan }
 */

// @ts-nocheck — Deno runtime types
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authError || !authUser) throw new Error('Unauthorized');

    // Check usage limits and subscription status
    const { data: usageData, error: usageError } = await supabase
      .rpc('check_and_reset_ai_usage', { user_uuid: authUser.id });

    if (usageError) throw usageError;
    const { status, usage_count } = usageData[0];

    // Limit check for Free users (1 workout generation/day)
    const MAX_FREE_WORKOUTS = 1;
    if (status === 'free' && usage_count >= MAX_FREE_WORKOUTS) {
      return new Response(
        JSON.stringify({ 
          error: 'Daily workout generation limit reached', 
          code: 'LIMIT_REACHED',
          message: 'Günlük antrenman oluşturma limitine ulaştın. Sınırsız antrenman için Premium\'a geç!' 
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { userId, planType, equipment } = await req.json();

    // Fetch user profile (redundant check but keeps consistency)
    const { data: user } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch recent workout history for personalization
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: recentWorkouts } = await supabase
      .from('workout_logs')
      .select('workout_type, title, duration_minutes, calories_burned, exercises, logged_at')
      .eq('user_id', authUser.id)
      .gte('logged_at', weekAgo.toISOString())
      .order('logged_at', { ascending: false })
      .limit(10);

    // Build the prompt - passing subscription status to build personalized vs basic plan
    const prompt = buildWorkoutPrompt(user, planType, equipment, recentWorkouts ?? [], status === 'premium' || status === 'trialing');

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert personal trainer. Generate structured workout plans in JSON format. Be specific about exercises, sets, reps, and rest periods.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 2000,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const planData = JSON.parse(result.choices?.[0]?.message?.content ?? '{}');

    // Store the plan
    const { data: plan, error } = await supabase
      .from('workout_plans')
      .insert({
        user_id: authUser.id,
        title: planData.title ?? `${planType} Plan`,
        plan_type: planType,
        goal: user.fitness_goal,
        equipment: equipment,
        generated_by: 'ai',
        plan_data: planData.days ?? [],
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;

    // Deactivate previous plans
    await supabase
      .from('workout_plans')
      .update({ is_active: false })
      .eq('user_id', authUser.id)
      .neq('id', plan.id);

    // Increment usage count for Free users
    if (status === 'free') {
      await supabase
        .from('users')
        .update({ 
          daily_ai_usage_count: usage_count + 1,
          last_ai_usage_at: new Date().toISOString()
        })
        .eq('id', authUser.id);
    }

    return new Response(
      JSON.stringify({ plan }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[generate-workout] Error:', error);
    const errorMsg = error.message || 'Unknown error';
    const isClientError = errorMsg.includes('required') || errorMsg.includes('not found') || errorMsg.includes('quota') || errorMsg.includes('limit reached');
    const safeErrorMsg = isClientError ? errorMsg : 'An internal server error occurred while processing your request. Please try again later.';

    return new Response(
      JSON.stringify({ error: safeErrorMsg }),
      {
        status: errorMsg.includes('limit') ? 403 : 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function buildWorkoutPrompt(
  user: any,
  planType: string,
  equipment: string[],
  recentWorkouts: any[],
  isPremium: boolean
): string {
  const daysCount = planType === 'daily' ? 1 : planType === 'weekly' ? 7 : 30;

  let detailInstruction = '';
  if (isPremium) {
    detailInstruction = `
- Provide a HIGHLY DETAILED and PERSONALIZED plan.
- Include advanced techniques (supersets, drop sets, etc.) if applicable.
- Tailor precisely to past performance and goals.
- Include detailed warm-up and cool-down instructions.`;
  } else {
    detailInstruction = `
- Provide a BASIC, Standard level plan. 
- Stick to fundamental exercises and routines.
- This is a free-tier basic plan.`;
  }

  return `Generate a ${planType} workout plan for this person:

PROFILE:
- Goal: ${user.fitness_goal ?? 'general fitness'}
- Activity Level: ${user.activity_level ?? 'moderate'}
- Gender: ${user.gender ?? 'not specified'}
- Weight: ${user.weight_kg ?? 'unknown'} kg
- Height: ${user.height_cm ?? 'unknown'} cm

AVAILABLE EQUIPMENT: ${equipment.length > 0 ? equipment.join(', ') : 'bodyweight only'}

RECENT WORKOUTS (last 7 days):
${recentWorkouts.length > 0
  ? recentWorkouts.map(w => `- ${w.title ?? w.workout_type}: ${w.duration_minutes ?? '?'} min`).join('\n')
  : 'No recent workouts'
}

TIER INSTRUCTIONS:${detailInstruction}

Generate a plan with ${daysCount} days. For each day, include:
- dayNumber (1-indexed)
- dayName (e.g., "Monday — Upper Body Push")
- focus (e.g., "Chest, Shoulders, Triceps")
- restDay (boolean)
- estimatedDurationMin
- exercises: array of { name, sets, reps, weightKg (optional), restSeconds, notes (optional) }

Respond with JSON: { "title": "...", "days": [...] }`;
}
