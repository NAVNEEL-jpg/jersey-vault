import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function check() {
  console.time('query with spaces');
  const res1 = await supabase.from('products').select("id, name, price, type, size_stock, stock, image_url, status, team_id").eq('status', 'active');
  console.timeEnd('query with spaces');
  
  if (res1.error) {
    console.error("Error with spaces:", res1.error);
  } else {
    console.log("Success with spaces, first row keys:", res1.data.length > 0 ? Object.keys(res1.data[0]) : "No data");
  }

  console.time('query without spaces');
  const res2 = await supabase.from('products').select("id,name,price,type,size_stock,stock,image_url,status,team_id").eq('status', 'active');
  console.timeEnd('query without spaces');
}
check();
