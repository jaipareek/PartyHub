import supabase from "./config/supabase.js";

async function run() {
  try {
    const { data, error } = await supabase
      .from("table_reservations")
      .select("*")
      .limit(1);

    if (error) {
      console.log("Error querying table_reservations:", error.message, error.code);
    } else {
      console.log("table_reservations exists! Data:", data);
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

run();
