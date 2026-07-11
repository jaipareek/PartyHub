// ============================================
// 🍽️ Table Reservation Controller
// ============================================
import supabase from "../config/supabase.js";

// POST /api/table-reservations — Request a new table reservation
export const createReservation = async (req, res) => {
  try {
    const { venue_id, reservation_date, reservation_time, guest_count, seating_area, occasion, special_requests } = req.body;
    const userId = req.user.id;

    if (!venue_id || !reservation_date || !reservation_time || !guest_count || !seating_area || !occasion) {
      return res.status(400).json({ success: false, error: "Missing required reservation details" });
    }

    // 1. Verify venue exists and is verified
    const { data: venue, error: venueErr } = await supabase
      .from("venues")
      .select("name, owner_id")
      .eq("id", venue_id)
      .single();

    if (venueErr || !venue) {
      return res.status(404).json({ success: false, error: "Venue not found" });
    }

    // 2. Insert reservation
    const { data: reservation, error: reserveErr } = await supabase
      .from("table_reservations")
      .insert({
        user_id: userId,
        venue_id,
        reservation_date,
        reservation_time,
        guest_count: parseInt(guest_count),
        seating_area,
        occasion,
        special_requests,
        status: "pending"
      })
      .select()
      .single();

    if (reserveErr) throw reserveErr;

    // Fetch user's profile details to mention in the notification
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", userId)
      .single();

    // 3. Notify the venue owner
    await supabase.from("notifications").insert({
      user_id: venue.owner_id,
      title: "New Table Request! 🍽️",
      message: `${profile?.full_name || "A guest"} requested a table for ${guest_count} guests on ${reservation_date} at ${reservation_time.slice(0, 5)}.`,
      type: "booking",
      related_id: reservation.id,
      related_type: "table_reservation"
    });

    res.status(201).json({
      success: true,
      message: "Table reservation request submitted! 🍽️",
      data: reservation
    });
  } catch (error) {
    console.error("Error creating table reservation:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/table-reservations/my — Fetch customer's active table reservations
export const getMyReservations = async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: reservations, error } = await supabase
      .from("table_reservations")
      .select(`
        *,
        venue:venues (
          id, name, address, city, phone, email, images
        )
      `)
      .eq("user_id", userId)
      .order("reservation_date", { ascending: false });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error("Error getting user reservations:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/table-reservations/venue/:venueId — Fetch venue reservations for owner dashboard
export const getVenueReservations = async (req, res) => {
  try {
    const { venueId } = req.params;
    const userId = req.user.id;

    // 1. Verify user owns the venue
    const { data: venue, error: venueErr } = await supabase
      .from("venues")
      .select("id, owner_id")
      .eq("id", venueId)
      .single();

    if (venueErr || !venue) {
      return res.status(404).json({ success: false, error: "Venue not found" });
    }

    if (venue.owner_id !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized access to venue records" });
    }

    // 2. Fetch all table reservations with profile details
    const { data: reservations, error } = await supabase
      .from("table_reservations")
      .select(`
        *,
        guest:profiles (
          id, full_name, email, phone
        )
      `)
      .eq("venue_id", venueId)
      .order("reservation_date", { ascending: true });

    if (error) throw error;

    res.status(200).json({
      success: true,
      data: reservations
    });
  } catch (error) {
    console.error("Error getting venue reservations:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// PUT /api/table-reservations/:reservationId/status — Confirm or decline a reservation (Owner Action)
export const updateReservationStatus = async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { status } = req.body; // 'confirmed', 'declined', 'cancelled'
    const userId = req.user.id;

    if (!["confirmed", "declined", "cancelled"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid reservation status" });
    }

    // 1. Fetch reservation detail to get venue_id and guest user_id
    const { data: reservation, error: reserveErr } = await supabase
      .from("table_reservations")
      .select("*, venue:venues(name, owner_id)")
      .eq("id", reservationId)
      .single();

    if (reserveErr || !reservation) {
      return res.status(404).json({ success: false, error: "Reservation not found" });
    }

    // 2. Verify ownership
    if (reservation.venue.owner_id !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized to modify this reservation" });
    }

    // 3. Update status
    const { data: updated, error: updateErr } = await supabase
      .from("table_reservations")
      .update({ status })
      .eq("id", reservationId)
      .select()
      .single();

    if (updateErr) throw updateErr;

    // 4. Send notification to the guest customer
    const outcomeMessage = status === "confirmed"
      ? `Your table reservation at ${reservation.venue.name} on ${reservation.reservation_date} at ${reservation.reservation_time.slice(0, 5)} has been confirmed! 🎉`
      : `Your table reservation at ${reservation.venue.name} on ${reservation.reservation_date} was declined.`;

    await supabase.from("notifications").insert({
      user_id: reservation.user_id,
      title: status === "confirmed" ? "Table Reservation Confirmed! 🍽️" : "Table Request Declined ❌",
      message: outcomeMessage,
      type: "booking",
      related_id: reservationId,
      related_type: "table_reservation"
    });

    res.status(200).json({
      success: true,
      message: `Reservation status updated to ${status}!`,
      data: updated
    });
  } catch (error) {
    console.error("Error updating reservation status:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
