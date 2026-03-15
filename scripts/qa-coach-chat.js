// Note: You must run this via `node scripts/qa-coach-chat.js`
// Make sure to provide OPENAI_API_KEY environment variable.

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
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const run = async () => {
  console.log('Testing coach-chat edge function...');
  const { data: chatData, error: chatError } = await supabase.functions.invoke('coach-chat', {
    body: {
      messages: [{ role: 'user', content: 'Hello Coach!' }],
    },
  });

  if (chatError) {
    console.error('coach-chat error:', chatError);
    return;
  }
  console.log('coach-chat response:', chatData.reply);

  console.log('\nTesting store-context edge function...');
  // Dummy user ID
  const testUserId = '00000000-0000-0000-0000-000000000000'; 
  const { data: storeData, error: storeError } = await supabase.functions.invoke('store-context', {
    body: {
      userId: testUserId,
      entryType: 'test',
      content: 'This is a test context entry for ' + new Date().toISOString(),
    },
  });

  if (storeError) {
    console.error('store-context error:', storeError);
    return;
  }
  console.log('store-context response:', storeData);

  console.log('\nTesting search-context edge function...');
  const { data: searchData, error: searchError } = await supabase.functions.invoke('search-context', {
    body: {
      userId: testUserId,
      query: 'test context entry',
      topK: 1,
    },
  });

  if (searchError) {
    console.error('search-context error:', searchError);
    return;
  }
  console.log('search-context entries found:', searchData.entries?.length);
  if (searchData.entries?.length > 0) {
     console.log('Top match similarity:', searchData.entries[0].similarity);
  }
};

run().catch(console.error);
