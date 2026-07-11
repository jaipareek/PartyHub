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

// GET /api/owner/events/:eventId/attendees — Get all ticket bookings for an event
export const getEventAttendees = async (req, res) => {
  try {
    const { eventId } = req.params;
    const userId = req.user.id;

    // 1. Verify event ownership
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("*, venues!inner(owner_id)")
      .eq("id", eventId)
      .single();

    if (eventErr || !event || event.venues.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not own this event.",
      });
    }

    // 2. Fetch bookings
    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select(`
        *,
        user:profiles (id, full_name, email)
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (bookingsErr) throw bookingsErr;

    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    console.error("Error getting attendees:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/owner/bookings/:code/check-in — Check in ticket code at gate
export const checkInBooking = async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user.id;

    // 1. Find booking and resolve ownership
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("*, event:events!inner(venues!inner(owner_id))")
      .eq("booking_code", code.toUpperCase())
      .single();

    if (bookingErr || !booking) {
      return res.status(404).json({ success: false, error: "Invalid booking code" });
    }

    if (booking.event.venues.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        error: "Access denied. You do not own this venue.",
      });
    }

    if (booking.status === "checked_in") {
      const { data: fullBooking } = await supabase
        .from("bookings")
        .select(`
          *,
          user:profiles (id, full_name, email),
          event:events (id, title, date, start_time)
        `)
        .eq("id", booking.id)
        .single();

      return res.status(400).json({ 
        success: false, 
        error: "Ticket already checked in!", 
        data: fullBooking || booking 
      });
    }

    // 2. Perform check-in status update
    const { data: updated, error: updateErr } = await supabase
      .from("bookings")
      .update({
        status: "checked_in",
        checked_in_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // Fetch event title for check-in notification
    const { data: eventDetails } = await supabase
      .from("events")
      .select("title")
      .eq("id", booking.event_id)
      .single();

    await supabase.from("notifications").insert({
      user_id: booking.user_id,
      title: "Checked In at Gate! 🎟️",
      message: `You have successfully checked in for "${eventDetails?.title || "Event"}" at ${new Date().toLocaleTimeString("en-US", { hour: 'numeric', minute: '2-digit' })}.`,
      type: "booking",
      related_id: booking.id,
      related_type: "booking",
    });

    // Fetch enriched booking details to send to the gate scanner page
    const { data: fullBooking } = await supabase
      .from("bookings")
      .select(`
        *,
        user:profiles (id, full_name, email),
        event:events (id, title, date, start_time)
      `)
      .eq("id", booking.id)
      .single();

    res.status(200).json({
      success: true,
      message: "Checked in successfully! 🥂",
      data: fullBooking || updated,
    });
  } catch (error) {
    console.error("Check-in error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
