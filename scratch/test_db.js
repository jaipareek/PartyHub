import supabase from "../server/src/config/supabase.js";

async function test() {
  console.log("Querying squad_messages table...");
  const { data, error } = await supabase
    .from("squad_messages")
    .select(`
      *,
      user:profiles (id, full_name, avatar_url, role)
    `)
    .limit(1);

  if (error) {
    console.error("❌ Error querying squad_messages:", error);
  } else {
    console.log("✅ Success! Data:", data);
  }

  console.log("Querying list of tables in public schema...");
  const { data: tables, error: tableErr } = await supabase
    .rpc("get_tables"); // Let's check if standard queries work or do a general query
  
  if (tableErr) {
    // If RPC doesn't exist, let's try a direct query on a known table
    console.log("Checking if profiles table exists and has student columns:");
    const { data: profiles, error: pErr } = await supabase
      .from("profiles")
      .select("id, student_verification_status, student_id_url, aadhar_url")
      .limit(1);
    if (pErr) console.error("Profiles columns error:", pErr);
    else console.log("Profiles columns exist successfully!");
  }
}

test();
