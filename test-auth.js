const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vjekuzutkvaicuhtrzlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZWt1enV0a3ZhaWN1aHRyemx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjExNjQsImV4cCI6MjA4ODg5NzE2NH0._3pJyfZX_aqR4u3ZiDkwSFAODTq2xqDzUI0dMEWm2LU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing sign up...");
  const { data, error } = await supabase.auth.signUp({
    email: 'cancaneryilmaz2003+test@gmail.com',
    password: 'Password123!',
  });
  if (error) {
    console.error("SignUp Error:", error.message);
    return;
  }
  console.log("SignUp Data:", data);
  
  if (data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: data.user.id,
        email: 'cancaneryilmaz2003+test@gmail.com',
        display_name: 'Test User',
      });
    if (profileError) console.error("Profile Error:", profileError.message);
    else console.log("Profile created successfully!");
  }
}
test();
