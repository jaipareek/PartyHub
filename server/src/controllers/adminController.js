// ============================================
// 👑 Admin Controller — Platform Administration
// ============================================
import supabase from "../config/supabase.js";

// GET /api/admin/venues — List all venues for admin
export const getVenues = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("venues")
      .select(`
        *,
        owner:profiles!venues_owner_id_fkey (id, full_name, email)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Admin error fetching venues:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/admin/venues/:id/verify — Toggle verification status
export const verifyVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_verified } = req.body;

    if (is_verified === undefined) {
      return res.status(400).json({
        success: false,
        error: "Missing required field: is_verified",
      });
    }

    const { data, error } = await supabase
      .from("venues")
      .update({ is_verified })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({
      success: true,
      message: `Venue verification status updated to ${is_verified}`,
      data,
    });
  } catch (error) {
    console.error("Admin error verifying venue:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
