import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wkngjvsgafmdwejmckks.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndrbmdqdnNnYWZtZHdlam1ja2tzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njg1Nzc3MSwiZXhwIjoyMDkyNDMzNzcxfQ.m6YBzaH3pj9nl5aJc5sEUSV3-9OtCbTKR4FpUHYsr6w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  // Try inserting with 'plano-7-refeicoes'
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: 'e69a0397-f01c-4b5a-ba02-123456789abc', // dummy or existing uuid
      plan_id: '09105622-5374-4049-a532-72e0b58c91d9',
      status: 'active',
      tier: 'plano-7-refeicoes',
      billing_cycle: 'monthly'
    });

  if (error) {
    console.log('Error caught:', error.message);
  } else {
    console.log('Success:', data);
  }
}

test();
