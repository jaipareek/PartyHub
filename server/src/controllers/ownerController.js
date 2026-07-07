// ============================================
// 🎛️ Owner Controller — Dashboard data for venue owners
// ============================================

import supabase from "../config/supabase.js";

// GET /api/owner/profile — Get owner's profile with venue
export const getOwnerProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get profile
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (profileErr) throw profileErr;

    // Get their venue (if exists)
    const { data: venue, error: venueErr } = await supabase
      .from("venues")
      .select("*")
      .eq("owner_id", userId)
      .single();

    res.status(200).json({
      success: true,
      data: {
        profile,
        venue: venue || null,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/owner/events — Get all events belonging to owner's venue
export const getOwnerEvents = async (req, res) => {
  try {
    const userId = req.user.id;

    // First get the owner's venue
    const { data: venue, error: venueErr } = await supabase
      .from("venues")
      .select("id")
      .eq("owner_id", userId)
      .single();

    if (venueErr || !venue) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Then get all events for that venue
    const { data: events, error: eventErr } = await supabase
      .from("events")
      .select("*")
      .eq("venue_id", venue.id)
      .order("date", { ascending: false });

    if (eventErr) throw eventErr;

    res.status(200).json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
