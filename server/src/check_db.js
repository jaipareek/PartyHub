import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function check() {
  console.log("Testing direct profiles insert...");
  
  const testId = "00000000-0000-0000-0000-000000000002"; // Needs to exist in auth.users if FK is active, so we might get FK violation, which is expected and proves table works.
  
  const { data, error } = await supabase
    .from("profiles")
    .insert({
      id: testId,
      full_name: "Test User",
      email: "test@example.com",
      role: "customer"
    })
    .select();
    
  if (error) {
    console.log("Insert result (Error is expected if user doesn't exist in auth.users):", error.message);
  } else {
    console.log("Insert succeeded:", data);
    // Cleanup
    await supabase.from("profiles").delete().eq("id", testId);
  }
}

check();


