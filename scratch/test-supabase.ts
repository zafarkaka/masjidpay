import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

console.log('Supabase URL:', supabaseUrl);

async function testSupabase() {
  if (!supabaseUrl || !supabaseKey) {
    console.log('Missing Supabase URL or Key in environment.');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  console.log('Testing Supabase REST Client...');
  try {
    const { data, error } = await supabase.from('User').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('REST query failed:', error.message);
    } else {
      console.log('REST query succeeded, data:', data);
    }
  } catch (err: any) {
    console.error('REST connection error:', err.message);
  }

  console.log('\nTesting raw fetch to Supabase REST API...');
  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
      },
    });
    console.log('Fetch status:', res.status);
    const body = await res.text();
    console.log('Fetch response:', body.substring(0, 500));
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

testSupabase();
