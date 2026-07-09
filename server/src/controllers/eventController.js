// ============================================
// 🎉 Event Controller — All event-related logic
// ============================================
// 🧠 LEARN: Controllers contain the BUSINESS LOGIC
// They receive the request, talk to the database, and send a response
// Routes just define WHICH URL maps to WHICH controller function

import supabase from "../config/supabase.js";

// GET /api/events — Get all active events
export const getEvents = async (req, res) => {
  try {
    // 🧠 LEARN: Supabase query builder
    // .from("events") = SELECT FROM events
    // .select("*") = SELECT all columns
    // .eq("is_active", true) = WHERE is_active = true
    // .order("date") = ORDER BY date ascending
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        venues!inner (
          id, name, city, images, category, is_verified
        )
      `)
      .eq("is_active", true)
      .eq("venues.is_verified", true)
      .order("date", { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching events:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/events/trending — Get most booked events
export const getTrendingEvents = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        venues!inner (id, name, city, images, category, is_verified)
      `)
      .eq("is_active", true)
      .eq("venues.is_verified", true)
      .order("booked_count", { ascending: false })
      .limit(10);

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/events/tonight — Get today's events
export const getTonightEvents = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // "2026-06-06"

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        venues!inner (id, name, city, images, category, is_verified)
      `)
      .eq("is_active", true)
      .eq("venues.is_verified", true)
      .eq("date", today)
      .order("start_time", { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/events/weekend — Get upcoming weekend events
export const getWeekendEvents = async (req, res) => {
  try {
    // 🧠 LEARN: Calculate next Saturday and Sunday
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
    const daysUntilSat = (6 - dayOfWeek) % 7 || 7;
    const saturday = new Date(today);
    saturday.setDate(today.getDate() + daysUntilSat);
    const sunday = new Date(saturday);
    sunday.setDate(saturday.getDate() + 1);

    const satStr = saturday.toISOString().split("T")[0];
    const sunStr = sunday.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        venues!inner (id, name, city, images, category, is_verified)
      `)
      .eq("is_active", true)
      .eq("venues.is_verified", true)
      .or(`date.eq.${satStr},date.eq.${sunStr}`)
      .order("date", { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/events/student-deals — Get student discount events
export const getStudentDeals = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        venues!inner (id, name, city, images, category, is_verified)
      `)
      .eq("is_active", true)
      .eq("venues.is_verified", true)
      .eq("is_student_deal", true)
      .order("date", { ascending: true });

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/events/:id — Get single event by ID
export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("events")
      .select(`
        *,
        venues!inner (*)
      `)
      .eq("id", id)
      .eq("venues.is_verified", true)
      .single(); // 🧠 .single() returns one object instead of an array

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/events/search?q=keyword&category=club_night&city=mumbai&sort=date
export const searchEvents = async (req, res) => {
  try {
    const { q, category, city, sort } = req.query;

    let query = supabase
      .from("events")
      .select(`
        *,
        venues!inner (id, name, city, images, category, is_verified)
      `)
      .eq("is_active", true)
      .eq("venues.is_verified", true);

    // 🧠 LEARN: Chaining filters conditionally
    // We only add a filter if the query parameter exists
    if (q) {
      query = query.ilike("title", `%${q}%`); // Case-insensitive LIKE search
    }
    if (category) {
      query = query.eq("event_type", category);
    }
    if (city) {
      query = query.eq("venues.city", city);
    }

    // 🧠 LEARN: Dynamic sorting
    // The sort parameter controls how results are ordered
    switch (sort) {
      case "popularity":
        query = query.order("booked_count", { ascending: false });
        break;
      case "date":
      default:
        query = query.order("date", { ascending: true });
        break;
    }

    const { data, error } = await query;

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================
// 🎛️ CRUD Operations (Venue Owner Dashboard)
// ============================================

// POST /api/events — Create a new event
export const createEvent = async (req, res) => {
  try {
    const {
      venue_id, title, description, event_type, poster_url,
      date, start_time, end_time, pricing, total_capacity,
      is_student_deal, student_discount_percent, tags,
    } = req.body;

    if (!venue_id || !title || !event_type || !date || !start_time || !total_capacity) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: venue_id, title, event_type, date, start_time, total_capacity",
      });
    }

    const { data, error } = await supabase
      .from("events")
      .insert({
        venue_id,
        title,
        description: description || "",
        event_type,
        poster_url: poster_url || "",
        date,
        start_time,
        end_time: end_time || null,
        pricing: pricing || [],
        total_capacity: parseInt(total_capacity),
        is_student_deal: is_student_deal || false,
        student_discount_percent: student_discount_percent || 0,
        tags: tags || [],
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error("Error creating event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/events/:id — Update an event
export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Error updating event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// DELETE /api/events/:id — Soft-delete an event
export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("events")
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.status(200).json({ success: true, message: "Event deleted", data });
  } catch (error) {
    console.error("Error deleting event:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
