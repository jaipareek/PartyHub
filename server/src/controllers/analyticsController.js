// ============================================
// 📈 Analytics Controller — Owner operations reports
// ============================================
import supabase from "../config/supabase.js";

// GET /api/owner/analytics/:venueId — Get stats & timeline data for chart visualizations
export const getVenueAnalytics = async (req, res) => {
  try {
    const { venueId } = req.params;
    const userId = req.user.id;

    // 1. Verify user owns the venue
    const { data: venue, error: venueErr } = await supabase
      .from("venues")
      .select("id, owner_id, name")
      .eq("id", venueId)
      .single();

    if (venueErr || !venue) {
      return res.status(404).json({ success: false, error: "Venue not found" });
    }

    if (venue.owner_id !== userId) {
      return res.status(403).json({ success: false, error: "Unauthorized access to venue analytics" });
    }

    // 2. Fetch all events for this venue
    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("id, title")
      .eq("venue_id", venueId);

    if (eventsErr) throw eventsErr;

    // Initialize default results if there are no events
    let bookings = [];
    if (events && events.length > 0) {
      const eventIds = events.map((e) => e.id);
      
      // Fetch all bookings for these events
      const { data: bookingsData, error: bookingsErr } = await supabase
        .from("bookings")
        .select("*")
        .in("event_id", eventIds)
        .order("created_at", { ascending: true });

      if (bookingsErr) throw bookingsErr;
      bookings = bookingsData || [];
    }

    // Fetch all table reservations for this venue
    const { data: tableRes, error: tableResErr } = await supabase
      .from("table_reservations")
      .select("*")
      .eq("venue_id", venueId)
      .order("reservation_date", { ascending: true });

    if (tableResErr) throw tableResErr;
    const reservations = tableRes || [];

    // ============================================
    // 📊 METRICS & TIMELINE CALCULATIONS
    // ============================================

    // KPI 1: Total Revenue
    const validBookings = bookings.filter((b) => b.status !== "cancelled");
    const totalRevenue = validBookings.reduce((sum, b) => sum + parseFloat(b.total_amount || 0), 0);

    // KPI 2: Total Passes Booked
    const totalPasses = validBookings.reduce((sum, b) => sum + parseInt(b.quantity || 0), 0);

    // KPI 3: Check-in Attendance Rate
    const checkedInCount = bookings.filter((b) => b.status === "checked_in").length;
    const confirmedCount = bookings.filter((b) => b.status === "confirmed" || b.status === "checked_in").length;
    const checkInRate = confirmedCount > 0 ? Math.round((checkedInCount / confirmedCount) * 100) : 0;

    // KPI 4: Table Bookings stats
    const totalTables = reservations.length;
    const pendingTables = reservations.filter((r) => r.status === "pending").length;

    // 📈 Chart 1: Sales History (Last 14 days)
    const salesMap = {};
    // Seed last 14 days
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      salesMap[label] = { date: label, revenue: 0, passes: 0 };
    }

    validBookings.forEach((b) => {
      const date = new Date(b.created_at);
      const label = date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
      if (salesMap[label]) {
        salesMap[label].revenue += parseFloat(b.total_amount || 0);
        salesMap[label].passes += parseInt(b.quantity || 0);
      }
    });
    const salesHistory = Object.values(salesMap);

    // 📈 Chart 2: Hourly Gate Entry Arrivals (for checked_in bookings)
    const hourlyMap = {
      "07 PM": 0, "08 PM": 0, "09 PM": 0, "10 PM": 0, "11 PM": 0, "12 AM": 0, "01 AM": 0, "02 AM": 0
    };

    bookings.forEach((b) => {
      if (b.status === "checked_in" && b.checked_in_at) {
        const time = new Date(b.checked_in_at);
        let hours = time.getHours();
        const ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; // convert 0 to 12
        const hourStr = `${hours.toString().padStart(2, "0")} ${ampm}`;
        if (hourlyMap[hourStr] !== undefined) {
          hourlyMap[hourStr] += parseInt(b.quantity || 1);
        }
      }
    });
    const checkinArrivals = Object.keys(hourlyMap).map((hour) => ({
      hour,
      count: hourlyMap[hour]
    }));

    // 📈 Chart 3: Guest Profile Segments (Regular vs Student Deals)
    let studentBookingsCount = 0;
    let regularBookingsCount = 0;

    validBookings.forEach((b) => {
      const tier = (b.tier_type || "").toLowerCase();
      if (tier.includes("student")) {
        studentBookingsCount += parseInt(b.quantity || 1);
      } else {
        regularBookingsCount += parseInt(b.quantity || 1);
      }
    });

    const guestSegments = [
      { name: "Regular Tickets", value: regularBookingsCount },
      { name: "Student Passes", value: studentBookingsCount }
    ];

    res.status(200).json({
      success: true,
      data: {
        venueName: venue.name,
        kpis: {
          totalRevenue,
          totalPasses,
          checkInRate,
          totalTables,
          pendingTables
        },
        salesHistory,
        checkinArrivals,
        guestSegments
      }
    });
  } catch (error) {
    console.error("Error generating analytics data:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
