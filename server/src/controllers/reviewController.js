// ============================================
// ⭐️ Review Controller — Venue Feedback & Ratings
// ============================================
import supabase from "../config/supabase.js";

// POST /api/reviews — Create a new review
export const createReview = async (req, res) => {
  try {
    const {
      venue_id,
      booking_id,
      music_rating,
      food_rating,
      crowd_rating,
      safety_rating,
      atmosphere_rating,
      comment,
    } = req.body;

    if (!venue_id) {
      return res.status(400).json({ success: false, error: "Missing required field: venue_id" });
    }

    const userId = req.user.id;

    // 1. Check if user already reviewed this venue
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("venue_id", venue_id)
      .maybeSingle();

    if (existingReview) {
      return res.status(400).json({
        success: false,
        error: "You have already submitted a review for this venue.",
      });
    }

    // 2. Compute overall score (average of ratings provided)
    const ratings = [music_rating, food_rating, crowd_rating, safety_rating, atmosphere_rating].filter(
      (r) => r !== undefined && r !== null
    );

    const overallScore =
      ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;

    // 3. Create review record
    const { data: review, error: reviewErr } = await supabase
      .from("reviews")
      .insert({
        user_id: userId,
        venue_id,
        booking_id: booking_id || null,
        music_rating,
        food_rating,
        crowd_rating,
        safety_rating,
        atmosphere_rating,
        overall_score: parseFloat(overallScore),
        comment: comment || "",
      })
      .select()
      .single();

    if (reviewErr) throw reviewErr;

    res.status(201).json({
      success: true,
      message: "Review submitted successfully! Thank you for the feedback.",
      data: review,
    });
  } catch (error) {
    console.error("Error creating review:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reviews/venue/:venueId — Get reviews list for a venue
export const getVenueReviews = async (req, res) => {
  try {
    const { venueId } = req.params;

    const { data: reviews, error } = await supabase
      .from("reviews")
      .select(`
        *,
        user:profiles (id, full_name, avatar_url)
      `)
      .eq("venue_id", venueId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Aggregate rating statistics
    let stats = {
      overall: 0,
      safety: 0,
      music: 0,
      food: 0,
      crowd: 0,
      atmosphere: 0,
      count: reviews.length,
    };

    if (reviews.length > 0) {
      let sumOverall = 0, sumSafety = 0, sumMusic = 0, sumFood = 0, sumCrowd = 0, sumAtmosphere = 0;
      let countSafety = 0, countMusic = 0, countFood = 0, countCrowd = 0, countAtmosphere = 0;

      reviews.forEach((r) => {
        sumOverall += parseFloat(r.overall_score || 0);
        if (r.safety_rating) { sumSafety += r.safety_rating; countSafety++; }
        if (r.music_rating) { sumMusic += r.music_rating; countMusic++; }
        if (r.food_rating) { sumFood += r.food_rating; countFood++; }
        if (r.crowd_rating) { sumCrowd += r.crowd_rating; countCrowd++; }
        if (r.atmosphere_rating) { sumAtmosphere += r.atmosphere_rating; countAtmosphere++; }
      });

      stats.overall = (sumOverall / reviews.length).toFixed(1);
      stats.safety = countSafety > 0 ? (sumSafety / countSafety).toFixed(1) : 0;
      stats.music = countMusic > 0 ? (sumMusic / countMusic).toFixed(1) : 0;
      stats.food = countFood > 0 ? (sumFood / countFood).toFixed(1) : 0;
      stats.crowd = countCrowd > 0 ? (sumCrowd / countCrowd).toFixed(1) : 0;
      stats.atmosphere = countAtmosphere > 0 ? (sumAtmosphere / countAtmosphere).toFixed(1) : 0;
    }

    res.status(200).json({
      success: true,
      stats,
      data: reviews,
    });
  } catch (error) {
    console.error("Error getting reviews:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};

// GET /api/reviews/venue/:venueId/check-eligibility — Check if user is eligible to write a review
export const checkEligibleForReview = async (req, res) => {
  try {
    const { venueId } = req.params;
    const userId = req.user.id;

    // 1. Look for confirmed bookings at this venue
    const { data: bookings, error: bookingsErr } = await supabase
      .from("bookings")
      .select("*, event:events!inner(venue_id)")
      .eq("user_id", userId)
      .eq("event.venue_id", venueId);

    if (bookingsErr) throw bookingsErr;

    // 2. Check if user already submitted a review
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("venue_id", venueId)
      .maybeSingle();

    res.status(200).json({
      success: true,
      eligible: bookings.length > 0,
      hasReviewed: !!existingReview,
    });
  } catch (error) {
    console.error("Eligibility check error:", error.message);
    res.status(500).json({ success: false, error: error.message });
  }
};
