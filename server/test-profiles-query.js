import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTests() {
  console.log('--- 1. Fetching Schema ---');
  const { data: schemaData, error: schemaError } = await supabase.from('profiles').select('*').limit(1);
  if (schemaError) {
    console.error('Schema Fetch Error:', JSON.stringify(schemaError, null, 2));
  } else {
    console.log('Columns in profiles:', Object.keys(schemaData[0] || {}));
  }

  console.log('\n--- 2. Running Simplified Query (select *) ---');
  const { data: simpleData, error: simpleError } = await supabase.from('profiles').select('*');
  if (simpleError) {
    console.error('Simple Query Error:', JSON.stringify(simpleError, null, 2));
  } else {
    console.log('Simple Query Success, row count:', simpleData.length);
  }

  console.log('\n--- 3. Running Original Failing Query ---');
  let query = supabase
      .from('profiles')
      .select('id, name, full_name, email, phone, role, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(0, 50);
  
  // adding search just to be safe
  const search = 'test';
  query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,full_name.ilike.%${search}%`);

  const { data: originalData, count, error: originalError } = await query;
  if (originalError) {
    console.error('Original Query Error Details:');
    console.error('Code:', originalError.code);
    console.error('Message:', originalError.message);
    console.error('Details:', originalError.details);
    console.error('Hint:', originalError.hint);
  } else {
    console.log('Original Query Success, count:', count);
  }

}

runTests();
