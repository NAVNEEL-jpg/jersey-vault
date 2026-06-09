import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testAdminStats() {
  const { data: orders, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
      
  console.log('Orders columns:', Object.keys(orders[0] || {}));
}

testAdminStats();
