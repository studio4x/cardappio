import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Read from .env.local
const envFile = fs.readFileSync('.env.local', 'utf-8');
const env = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    env[match[1]] = value.trim();
  }
});

const supabaseUrl = env['VITE_SUPABASE_URL'];
const serviceRole = env['SUPABASE_SERVICE_ROLE'];

if (!supabaseUrl || !serviceRole) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRole);

async function test() {
  const { data: settings, error: sErr } = await supabase.from('app_settings').select('*');
  console.log('--- app_settings ---');
  console.log(JSON.stringify(settings, null, 2));
  if (sErr) console.error(sErr);

  const { data: plans, error: pErr } = await supabase.from('subscription_plans').select('*');
  console.log('--- subscription_plans ---');
  console.log(JSON.stringify(plans, null, 2));
  if (pErr) console.error(pErr);
}
test();
