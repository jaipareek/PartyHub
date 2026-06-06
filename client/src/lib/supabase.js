import { createClient } from "@supabase/supabase-js";

// 🧠 LEARN: On the FRONTEND, we use the "anon key" (public key)
// This key has LIMITED access — it can only do what your RLS policies allow
// The "service key" (used on server) has FULL access — never expose it to the browser!
//
// VITE_ prefix is required for Vite to expose env variables to the browser
// Without VITE_ prefix, the variable will be undefined in the browser

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
