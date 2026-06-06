import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

// 🧠 LEARN: createClient takes two things:
// 1. SUPABASE_URL - the URL of your Supabase project (like an address)
// 2. SUPABASE_SERVICE_KEY - a SECRET key that gives full access (only use on server!)
//    This is different from the "anon key" which has limited access (used on frontend)

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables!");
  console.error("Make sure SUPABASE_URL and SUPABASE_SERVICE_KEY are set in your .env file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default supabase;
