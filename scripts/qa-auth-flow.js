const { createClient } = require('@supabase/supabase-js');

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing SUPABASE_URL and SUPABASE_ANON_KEY in env.');
  console.error('Example: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/qa-auth-flow.js');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const run = async () => {
  const timestamp = Date.now();
  const email = `qa+${timestamp}@beefit.test`;
  const password = `BeeFit!${timestamp}`;

  console.log('1) Sign up');
  const signUp = await supabase.auth.signUp({ email, password });
  if (signUp.error) throw signUp.error;

  if (!signUp.data.user) {
    throw new Error('Sign up failed: no user returned');
  }

  if (!signUp.data.session) {
    console.log('Sign up succeeded, but email confirmation is required.');
    console.log('Confirm the email, then re-run sign-in with the same credentials.');
    return;
  }

  console.log('2) Create profile row');
  const profileUpsert = await supabase
    .from('users')
    .upsert({
      id: signUp.data.user.id,
      email,
      display_name: 'QA User',
      updated_at: new Date().toISOString(),
    });
  if (profileUpsert.error) throw profileUpsert.error;

  console.log('3) Complete onboarding');
  const onboardingUpdate = await supabase
    .from('users')
    .update({
      fitness_goal: 'general',
      activity_level: 'moderate',
      daily_calorie_target: 2200,
      daily_protein_g: 150,
      daily_carbs_g: 250,
      daily_fat_g: 70,
      updated_at: new Date().toISOString(),
    })
    .eq('id', signUp.data.user.id);
  if (onboardingUpdate.error) throw onboardingUpdate.error;

  console.log('4) Sign in');
  const signIn = await supabase.auth.signInWithPassword({ email, password });
  if (signIn.error) throw signIn.error;

  console.log('Auth flow E2E success');
  console.log(`Test user: ${email}`);
};

run().catch((error) => {
  console.error('Auth flow E2E failed');
  console.error(error);
  process.exit(1);
});
