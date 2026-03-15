const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = 'https://vjekuzutkvaicuhtrzlt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqZWt1enV0a3ZhaWN1aHRyemx0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMjExNjQsImV4cCI6MjA4ODg5NzE2NH0._3pJyfZX_aqR4u3ZiDkwSFAODTq2xqDzUI0dMEWm2LU';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log("Testing sign in...");
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'cancaneryilmaz2003@gmail.com',
    password: 'Password123!', // Note: we don't know the password, just testing error
  });
  if (error) {
    console.error("SignIn Error:", error.message);
  } else {
    console.log("SignIn Success:", data.user.id);
  }
}
test();
