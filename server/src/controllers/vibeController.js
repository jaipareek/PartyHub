// ============================================
// ⚡ Live Vibe Check Controller
// ============================================
import supabase from "../config/supabase.js";

// POST /api/venues/:venueId/vibe-check — Submit a live crowd check-in report
export const submitVibeCheck = async (req, res) => {
  try {
    const venueId = req.params.id || req.params.venueId;
    const { vibe_type, crowd_status, energy_level } = req.body;
    const userId = req.user.id;

    if (!vibe_type || !crowd_status || !energy_level) {
      return res.status(400).json({ success: false, error: "Missing vibe check fields" });
    }

    // 1. Verify user is currently checked-in at this venue (within last 12 hours)
    // Find all events for this venue
    const { data: events, error: eventsErr } = await supabase
      .from("events")
      .select("id")
      .eq("venue_id", venueId);

    if (eventsErr) throw eventsErr;

    if (!events || events.length === 0) {
      return res.status(403).json({ success: false, error: "Access denied. Vibe checks are restricted to guests checked-in at this venue." });
    }

    const eventIds = events.map(e => e.id);

    // Look for active checked-in booking
    const twelveHoursAgo = new Date();
    twelveHoursAgo.setHours(twelveHoursAgo.getHours() - 12);

    const { data: booking, error: bookingErr } = await supabase
      .from("bookings")
      .select("id")
      .eq("user_id", userId)
      .eq("status", "checked_in")
      .in("event_id", eventIds)
      .gte("checked_in_at", twelveHoursAgo.toISOString())
      .limit(1);

    if (bookingErr) throw bookingErr;

    if (!booking || booking.length === 0) {
      return res.status(403).json({ 
        success: false, 
        error: "Vibe checks are locked! You must first be checked in at the gate by bouncers to report the atmosphere." 
      });
    }

    // 2. Submit vibe check
    const { data: vibeCheck, error: insertErr } = await supabase
      .from("vibe_checks")
      .insert({
        user_id: userId,
        venue_id: venueId,
        vibe_type,
        crowd_status,
        energy_level
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    res.status(201).json({
      success: true,
      message: "Live vibe check recorded! ⚡ Thank you for updating the crowd map.",
      data: vibeCheck
    });
  } catch (error) {
    console.error("Error submitting vibe check:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/venues/:venueId/live-vibe — Retrieve real-time crowd metrics
export const getVenueLiveVibe = async (req, res) => {
  try {
    const venueId = req.params.id || req.params.venueId;

    // 1. Fetch reports submitted in the last 4 hours
    const fourHoursAgo = new Date();
    fourHoursAgo.setHours(fourHoursAgo.getHours() - 4);

    const { data: reports, error } = await supabase
      .from("vibe_checks")
      .select("*")
      .eq("venue_id", venueId)
      .gte("created_at", fourHoursAgo.toISOString());

    if (error) throw error;

    // 2. Calculate aggregates
    if (!reports || reports.length === 0) {
      // 🔮 Fallback calculation: check active events occupancy ratios
      const today = new Date().toISOString().split("T")[0];
      const { data: activeEvent } = await supabase
        .from("events")
        .select("booked_count, total_capacity, event_type")
        .eq("venue_id", venueId)
        .eq("date", today)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();

      if (activeEvent && activeEvent.total_capacity > 0) {
        const ratio = activeEvent.booked_count / activeEvent.total_capacity;
        let density = 25; // default low
        let crowdLabel = "Cozy";
        if (ratio > 0.8) { density = 90; crowdLabel = "Packed"; }
        else if (ratio > 0.5) { density = 65; crowdLabel = "Busy"; }
        else if (ratio > 0.25) { density = 45; crowdLabel = "Moderate"; }

        const vibeMap = {
          club_night: "Techno 🍾",
          live_music: "Live Band 🎸",
          open_mic: "Acoustic 🎙️",
          standup: "Comedy 🎭",
        };

        return res.status(200).json({
          success: true,
          data: {
            densityPercent: density,
            crowdLabel,
            vibeLabel: vibeMap[activeEvent.event_type] || "Chill 🍷",
            energyLabel: ratio > 0.5 ? "High Energy 🔥" : "Medium Vibe 🍷",
            votesCount: 0
          }
        });
      }

      // Default fallback if no event is live
      return res.status(200).json({
        success: true,
        data: {
          densityPercent: 15,
          crowdLabel: "Cozy",
          vibeLabel: "Chill 🍷",
          energyLabel: "Chill Vibe 🛋️",
          votesCount: 0
        }
      });
    }

    // Process actual reports
    const vibeVotes = {};
    const crowdVotes = {};
    const energyVotes = {};

    reports.forEach((r) => {
      vibeVotes[r.vibe_type] = (vibeVotes[r.vibe_type] || 0) + 1;
      crowdVotes[r.crowd_status] = (crowdVotes[r.crowd_status] || 0) + 1;
      energyVotes[r.energy_level] = (energyVotes[r.energy_level] || 0) + 1;
    });

    // Find majority vote
    const getMajority = (votes) => {
      let maxVal = 0;
      let maxKey = "";
      Object.keys(votes).forEach((k) => {
        if (votes[k] > maxVal) {
          maxVal = votes[k];
          maxKey = k;
        }
      });
      return maxKey;
    };

    const topVibe = getMajority(vibeVotes);
    const topCrowd = getMajority(crowdVotes);
    const topEnergy = getMajority(energyVotes);

    // Density mapping percentages
    const densityMap = {
      empty: 10,
      cozy: 30,
      busy: 65,
      packed: 95
    };

    const crowdLabels = {
      empty: "Empty 🍃",
      cozy: "Cozy 🛋️",
      busy: "Busy 🕺",
      packed: "Packed 🔥"
    };

    const vibeLabels = {
      techno: "Techno 🍾",
      bollywood: "Bollywood 💃",
      hiphop: "Hip-Hop 🎤",
      chill: "Chill 🍷",
      pop: "Pop Hits 🎸",
      live_band: "Live Band 🎸"
    };

    const energyLabels = {
      high: "High Energy 🔥",
      medium: "Medium Vibe 🍷",
      chill: "Chill Vibe 🛋️"
    };

    res.status(200).json({
      success: true,
      data: {
        densityPercent: densityMap[topCrowd] || 30,
        crowdLabel: crowdLabels[topCrowd] || "Cozy",
        vibeLabel: vibeLabels[topVibe] || "Chill 🍷",
        energyLabel: energyLabels[topEnergy] || "Chill Vibe 🛋️",
        votesCount: reports.length
      }
    });
  } catch (error) {
    console.error("Error getting live vibe metrics:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
