// ============================================
// 🎟️ Booking Controller — Event Reservations
// ============================================
import supabase from "../config/supabase.js";

// POST /api/bookings — Create a new booking
export const createBooking = async (req, res) => {
  try {
    const { event_id, tier_type, quantity, booking_type } = req.body;

    if (!event_id || !tier_type || !quantity) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: event_id, tier_type, quantity",
      });
    }

    // 1. Retrieve the event
    const { data: event, error: eventErr } = await supabase
      .from("events")
      .select("*")
      .eq("id", event_id)
      .single();

    if (eventErr || !event) {
      return res.status(404).json({ success: false, error: "Event not found" });
    }

    // 2. Validate capacity
    if (event.booked_count + quantity > event.total_capacity) {
      return res.status(400).json({
        success: false,
        error: "Not enough tickets available. Event is almost full!",
      });
    }

    // 3. Locate correct tier pricing
    const pricingList = event.pricing || [];
    const matchedTier = pricingList.find((t) => t.type === tier_type);
    if (!matchedTier) {
      return res.status(400).json({
        success: false,
        error: `Invalid ticket tier: ${tier_type}. Available: ${pricingList.map((t) => t.type).join(", ")}`,
      });
    }

    // Get customer profile details
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_student")
      .eq("id", req.user.id)
      .single();

    const unitPrice = parseFloat(matchedTier.price || 0);
    const basePrice = unitPrice * quantity;
    const isStudentDealApplied = profile?.is_student && event.is_student_deal;
    const discountPercent = isStudentDealApplied ? (event.student_discount_percent || 0) : 0;
    const totalAmount = basePrice * (1 - discountPercent / 100);

    // 4. Generate unique alphanumeric booking serial code (e.g. AD-L6J9Q2)
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "AD-";
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    // 5. Create booking entry in DB
    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .insert({
        user_id: req.user.id,
        event_id,
        booking_type: booking_type || "ticket",
        tier_type,
        quantity,
        total_amount: totalAmount,
        status: "confirmed",
        payment_status: "paid",
        booking_code: code,
        qr_code: `afterdark://booking/${code}`,
      })
      .select()
      .single();

    if (bookingErr) throw bookingErr;

    // 6. Update event's booked count
    await supabase
      .from("events")
      .update({ booked_count: (event.booked_count || 0) + quantity })
      .eq("id", event_id);

    res.status(201).json({
      success: true,
      message: "Event booked successfully! 🎉",
      data: booking,
    });
  } catch (error) {
    console.error("Booking creation error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/bookings/my-bookings — Fetch customer's confirmed bookings
export const getMyBookings = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        event:events (
          id, title, date, start_time, end_time, poster_url,
          venue:venues (id, name, address, city)
        )
      `)
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    console.error("Error fetching my bookings:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/bookings/:id — Fetch details for a specific booking
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        event:events (
          id, title, date, start_time, end_time, poster_url,
          venue:venues (id, name, address, city)
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ success: false, error: "Booking record not found" });
    }

    // Double check user authorization
    if (data.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ success: false, error: "Access denied" });
    }

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
