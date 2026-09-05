import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });

const DEFAULT_SUPABASE_URL = 'https://gpyzxpefddvxmjzxyhzy.supabase.co';
const DEFAULT_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweXp4cGVmZGR2eG1qenh5aHp5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQwMjM1NiwiZXhwIjoyMTAzOTc4MzU2fQ.H8hCWuMab8DKPs-HW6QCtkyIuPl8F12nFCEzPCv5d9g';

const envUrl = process.env.SUPABASE_URL;
const supabaseUrl = (!envUrl || envUrl.includes('clytujskrmcnstzuvuaf')) ? DEFAULT_SUPABASE_URL : envUrl;

const envKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseServiceKey = (!envKey || !envUrl || envUrl.includes('clytujskrmcnstzuvuaf')) ? DEFAULT_SERVICE_ROLE_KEY : envKey;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
