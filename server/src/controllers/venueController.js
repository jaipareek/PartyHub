// ============================================
// 🎉 Venue Controller — All venue-related logic
// ============================================

import supabase from "../config/supabase.js";

// GET /api/venues — Get all active verified venues
export const getVenues = async (req, res) => {
  try {
    const { city, category } = req.query;

    let query = supabase
      .from("venues")
      .select("*")
      .eq("is_active", true)
      .eq("is_verified", true);

    if (city) query = query.ilike("city", `%${city}%`);
    if (category) query = query.eq("category", category);

    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/venues/:id — Get single venue if verified with its upcoming active events
export const getVenueById = async (req, res) => {
  try {
    const { id } = req.params;
    const todayStr = new Date().toISOString().split("T")[0];

    // 🧠 LEARN: Nested select
    // venues(*) gets all venue columns
    // events(*) gets all events belonging to this venue
    const { data, error } = await supabase
      .from("venues")
      .select(`
        *,
        events (*)
      `)
      .eq("id", id)
      .eq("is_verified", true)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: "Venue not found" });
    }

    // Filter out past expired events
    if (data.events && Array.isArray(data.events)) {
      data.events = data.events.filter((e) => e.is_active && e.date >= todayStr);
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/venues/:id/events — Get all active upcoming events for a verified venue
export const getVenueEvents = async (req, res) => {
  try {
    const { id } = req.params;
    const todayStr = new Date().toISOString().split("T")[0];

    // Check if venue itself is verified
    const { data: venue, error: venueError } = await supabase
      .from("venues")
      .select("is_verified")
      .eq("id", id)
      .single();

    if (venueError || !venue || !venue.is_verified) {
      return res.status(404).json({ success: false, error: "Venue not found or unverified" });
    }

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("venue_id", id)
      .eq("is_active", true)
      .gte("date", todayStr)
      .order("date", { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// POST /api/venues — Create a new venue (venue owners only)
export const createVenue = async (req, res) => {
  try {
    const {
      name, description, category, address, city, state,
      latitude, longitude, phone, email, website,
      images, amenities, opening_time, closing_time,
      business_reg_no, id_proof
    } = req.body;

    // req.user is set by auth middleware (we'll add this on Day 3)
    const owner_id = req.user?.id;

    const { data, error } = await supabase
      .from("venues")
      .insert({
        owner_id,
        name, description, category, address, city, state,
        latitude, longitude, phone, email, website,
        images: images || [],
        amenities: amenities || [],
        opening_time, closing_time,
        business_reg_no, id_proof,
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/venues/:id — Update a venue
export const updateVenue = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("venues")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
