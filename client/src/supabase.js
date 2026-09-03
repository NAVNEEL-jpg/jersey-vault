import { createClient } from '@supabase/supabase-js';
import { express, cloudflare } from './express';

const DEFAULT_SUPABASE_URL = 'https://gpyzxpefddvxmjzxyhzy.supabase.co';
const DEFAULT_SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdweXp4cGVmZGR2eG1qenh5aHp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MDIzNTYsImV4cCI6MjEwMzk3ODM1Nn0.9DzJOrDNIXYJAmTzdVfHPmqkk8w0TFiLqpUS282KOIY';

const envUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseUrl = (!envUrl || envUrl.includes('clytujskrmcnstzuvuaf')) ? DEFAULT_SUPABASE_URL : envUrl;
const envKey = process.env.REACT_APP_SUPABASE_KEY;
const supabaseKey = (!envKey || !envUrl || envUrl.includes('clytujskrmcnstzuvuaf')) ? DEFAULT_SUPABASE_KEY : envKey;

// Clean up any stale tokens from the deleted Supabase project
if (typeof window !== 'undefined') {
  try {
    Object.keys(localStorage).forEach(key => {
      if (key.includes('clytujskrmcnstzuvuaf')) {
        localStorage.removeItem(key);
      }
    });
  } catch (_) {}
}

const rawSupabase = createClient(supabaseUrl, supabaseKey);

// Tables and resources handled by Cloudflare R2 via Express
const CLOUDFLARE_TABLES = new Set([
  'products',
  'teams',
  'site_settings',
  'categories',
  'subcategories',
  'reviews',
]);

// Proxy Supabase client to automatically route catalog & media to Cloudflare R2 through Express
export const supabase = new Proxy(rawSupabase, {
  get(target, prop, receiver) {
    if (prop === 'from') {
      return (tableName) => {
        if (CLOUDFLARE_TABLES.has(tableName)) {
          return express.from(tableName);
        }
        // orders, profiles, and auth remain strictly on Supabase
        return target.from.call(target, tableName);
      };
    }

    if (prop === 'storage') {
      return {
        from(bucket) {
          return express.storage.from(bucket);
        }
      };
    }

    // IMPORTANT: Use Reflect.get with target as receiver to preserve 'this' binding.
    // Without this, supabase.auth.onAuthStateChange, signInWithPassword, etc.
    // lose their 'this' context and silently fail (login never reflects in UI).
    const value = Reflect.get(target, prop, target);
    if (typeof value === 'function') {
      return value.bind(target);
    }
    return value;
  }
});

export { cloudflare, express };
export default supabase;