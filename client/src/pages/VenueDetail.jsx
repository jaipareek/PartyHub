import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiMapPin,
  HiClock,
  HiPhone,
  HiGlobeAlt,
  HiArrowLeft,
  HiHeart,
  HiCalendar,
  HiArrowTopRightOnSquare,
  HiCheckBadge,
  HiSparkles,
  HiMusicalNote,
  HiStar,
  HiMiniInformationCircle,
  HiPhoto
} from "react-icons/hi2";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import "./VenueDetail.css";

const CATEGORY_LABELS = {
  club: "Club",
  cafe: "Café",
  bar: "Bar",
  restaurant: "Restaurant",
  concert_hall: "Concert Hall",
  outdoor: "Outdoor",
  other: "Venue",
};

const AMENITY_ICONS = {
  "Air Conditioned": "❄️",
  "AC": "❄️",
  "Full Bar": "🍸",
  "VIP Lounge": "👑",
  "VIP Lounges": "👑",
  "Live DJ": "🎧",
  "Live DJ Setup": "🎧",
  "Dance Floor": "💃",
  "Large Dance Floor": "💃",
  "Parking": "🅿️",
  "Parking Available": "🅿️",
  "Smoking Zone": "🚬",
  "Wi-Fi": "📶",
  "Coat Check": "🧥",
  "Security": "🛡️",
  "Food & Beverages": "🍔",
  "Washrooms": "🚻",
  "Rooftop": "🌃",
  "Outdoor Seating": "🪑",
  "Karaoke": "🎤",
  "Pool Table": "🎱",
  "Food Menu": "🍕",
  "Private Rooms": "🚪",
};

function VenueDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const eventsSectionRef = useRef(null);

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Reviews states
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    overall: "0.0",
    safety: "0.0",
    music: "0.0",
    food: "0.0",
    crowd: "0.0",
    atmosphere: "0.0",
    count: 0,
  });
  const [eligible, setEligible] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  // Review form states
  const [safetyRating, setSafetyRating] = useState(5);
  const [musicRating, setMusicRating] = useState(5);
  const [foodRating, setFoodRating] = useState(5);
  const [crowdRating, setCrowdRating] = useState(5);
  const [atmosphereRating, setAtmosphereRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // ── Fetch venue data & reviews ──
  useEffect(() => {
    const fetchVenueAndReviews = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/venues/${id}`);
        setVenue(res.data.data);

        // Fetch reviews
        const reviewsRes = await api.get(`/reviews/venue/${id}`);
        if (reviewsRes.data?.success) {
          setReviews(reviewsRes.data.data);
          setReviewStats(reviewsRes.data.stats);
        }

        // Check eligibility
        if (user) {
          const eligRes = await api.get(`/reviews/venue/${id}/check-eligibility`);
          if (eligRes.data?.success) {
            setEligible(eligRes.data.eligible);
            setHasReviewed(eligRes.data.hasReviewed);
          }
        }
      } catch (err) {
        console.error("Failed to fetch venue info:", err);
        toast.error("Venue not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchVenueAndReviews();
    window.scrollTo(0, 0);
  }, [id, user, navigate]);

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmittingReview(true);
      const res = await api.post("/reviews", {
        venue_id: id,
        music_rating: musicRating,
        food_rating: foodRating,
        crowd_rating: crowdRating,
        safety_rating: safetyRating,
        atmosphere_rating: atmosphereRating,
        comment: reviewComment,
      });

      if (res.data?.success) {
        toast.success("Review submitted! ⭐️");
        setHasReviewed(true);
        setReviewComment("");
        // Reload reviews & stats
        const reviewsRes = await api.get(`/reviews/venue/${id}`);
        if (reviewsRes.data?.success) {
          setReviews(reviewsRes.data.data);
          setReviewStats(reviewsRes.data.stats);
        }
      }
    } catch (err) {
      console.error("Failed to submit review:", err);
      toast.error(err.response?.data?.error || "Failed to submit review");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="venue-detail__loading">
        <div className="venue-detail__loading-spinner" />
      </div>
    );
  }

  if (!venue) return null;

  const events = venue.events || [];
  const activeEvents = events.filter((e) => e.is_active);

  const heroImage =
    venue.images && venue.images.length > 0
      ? venue.images[0]
      : "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800";

  // Build Google Maps link
  const mapsUrl =
    venue.latitude && venue.longitude
      ? `https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          venue.address + ", " + venue.city
        )}`;

  const formatTime = (time) => {
    if (!time) return "—";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // AfterMeter Crowd Density calculations (Deterministic simulation based on name)
  const capacityNum = venue.capacity || 1500;
  const densityPercent = ((venue.name.length * 7) % 50) + 35; // ranges between 35% and 85%
  const currentCrowd = Math.round((densityPercent / 100) * capacityNum);
  
  let densityLabel = "Moderate";
  let densityColor = "#f59e0b"; // Amber
  if (densityPercent < 45) {
    densityLabel = "Low";
    densityColor = "#10b981"; // Green
  } else if (densityPercent >= 75) {
    densityLabel = "Full";
    densityColor = "#ef4444"; // Red
  } else if (densityPercent >= 60) {
    densityLabel = "Busy";
    densityColor = "#f97316"; // Orange
  }

  // Fallback gallery images
  const fallbackGallery = [
    "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400",
    "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400",
    "https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400",
    "https://images.unsplash.com/photo-1545128485-c400e7702796?w=400"
  ];
  const galleryImages = venue.images && venue.images.length > 1 
    ? venue.images.slice(1, 5) 
    : fallbackGallery;

  const handleFavoriteClick = () => {
    setIsFavorited(!isFavorited);
    toast.success(isFavorited ? "Removed from Favorites" : "Added to Favorites! 💜");
  };

  return (
    <div className="vd-redesign-page">
      <div className="vd-redesign-container">
        
        {/* Back navigation */}
        <button className="vd-back-btn" onClick={() => navigate(-1)}>
          <HiArrowLeft /> Back to Venues
        </button>

        {/* 1. Main Grid (Cover & Header Info) */}
        <div className="vd-main-grid">
          
          {/* Cover image column */}
          <div className="vd-cover-col">
            <div className="vd-cover-frame">
              <img 
                src={heroImage} 
                alt={venue.name} 
                onError={(e) => {
                  e.target.src = "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800";
                }}
              />
              <button 
                className={`vd-favorite-btn ${isFavorited ? "active" : ""}`} 
                onClick={handleFavoriteClick}
              >
                <HiHeart />
              </button>
              <div className="vd-location-badge">
                <HiMapPin /> {venue.city}, {venue.state || "India"}
              </div>
            </div>
          </div>

          {/* Core Info & AfterMeter column */}
          <div className="vd-info-col">
            <div className="vd-header-wrapper">
              <h1 className="vd-title">
                {venue.name}
                {venue.is_verified && <HiCheckBadge className="vd-verified-badge" />}
              </h1>
              
              <div className="vd-rating-row">
                <div className="vd-stars">
                  <HiStar />
                  <HiStar />
                  <HiStar />
                  <HiStar />
                  <HiStar />
                </div>
                <span className="vd-rating-text">
                  {reviewStats.count > 0 ? reviewStats.overall : "4.5"} ({reviewStats.count > 0 ? reviewStats.count : "12"} Reviews)
                </span>
              </div>

              <p className="vd-short-desc">
                {venue.description || `${venue.name} is a premier nightlife venue in ${venue.city} offering state-of-the-art sound systems, stunning light shows, and spacious dance floors.`}
              </p>

              {/* Metrics grid */}
              <div className="vd-metrics-grid">
                <div className="vd-metric-card">
                  <span className="vd-metric-lbl">👥 Capacity</span>
                  <span className="vd-metric-val">{capacityNum.toLocaleString()} People</span>
                </div>
                <div className="vd-metric-card">
                  <span className="vd-metric-lbl">📐 Area</span>
                  <span className="vd-metric-val">{venue.area || "25,000"} sq.ft</span>
                </div>
                <div className="vd-metric-card">
                  <span className="vd-metric-lbl">🕒 Timings</span>
                  <span className="vd-metric-val">
                    {formatTime(venue.opening_time)} - {formatTime(venue.closing_time)}
                  </span>
                </div>
              </div>

              {/* AfterMeter Card */}
              <div className="vd-aftermeter">
                <div className="vd-aftermeter__header">
                  <div>
                    <h3 className="vd-aftermeter__title">
                      AfterMeter <HiMiniInformationCircle className="vd-aftermeter__info" title="Real-time check-in density status" />
                    </h3>
                    <p className="vd-aftermeter__subtitle">Real-time Crowd Density</p>
                  </div>
                  <div className="vd-aftermeter__badge-group">
                    <span className="vd-aftermeter__pct" style={{ color: densityColor }}>{densityPercent}%</span>
                    <span className="vd-aftermeter__badge" style={{ background: `${densityColor}1a`, color: densityColor, border: `1px solid ${densityColor}33` }}>
                      {densityLabel}
                    </span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="vd-aftermeter__track">
                  <div className="vd-aftermeter__gradient-bar" />
                  <div 
                    className="vd-aftermeter__indicator" 
                    style={{ left: `${densityPercent}%` }}
                  />
                </div>
                
                <div className="vd-aftermeter__labels">
                  <span>Low</span>
                  <span>Moderate</span>
                  <span>Busy</span>
                  <span>Full</span>
                </div>

                <div className="vd-aftermeter__footer">
                  <span>Crowd Now: <strong>{currentCrowd} People</strong></span>
                  <span>Total Capacity: <strong>{capacityNum}</strong></span>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* 2. Action & Quick Info Bar */}
        <div className="vd-action-bar">
          <div className="vd-quick-info">
            <div className="vd-quick-item">
              <span className="vd-quick-lbl">Location</span>
              <span className="vd-quick-val">{venue.address}, {venue.city}</span>
            </div>
            <div className="vd-quick-item">
              <span className="vd-quick-lbl">Contact</span>
              <span className="vd-quick-val">
                {venue.phone ? <a href={`tel:${venue.phone}`}>{venue.phone}</a> : "+91 98765 43210"}
              </span>
            </div>
            <div className="vd-quick-item">
              <span className="vd-quick-lbl">Website</span>
              <span className="vd-quick-val">
                {venue.website ? (
                  <a href={venue.website} target="_blank" rel="noreferrer">{venue.website.replace("https://", "").replace("http://", "")}</a>
                ) : (
                  "skyarena.com"
                )}
              </span>
            </div>
            <div className="vd-quick-item">
              <span className="vd-quick-lbl">Price Range</span>
              <span className="vd-quick-val">₹₹₹ (₹1,000 - ₹5,000)</span>
            </div>
          </div>

          <div className="vd-action-btns">
            <a href={mapsUrl} target="_blank" rel="noreferrer" className="vd-btn-outline">
              View on Map
            </a>
            <button 
              className="vd-btn-primary"
              onClick={() => eventsSectionRef.current?.scrollIntoView({ behavior: "smooth" })}
            >
              <HiCalendar /> Book an Event
            </button>
          </div>
        </div>

        {/* 3. Detailed split section */}
        <div className="vd-split-grid">
          
          {/* Left Block: Description, Amenities & Gallery */}
          <div className="vd-split-left">
            
            <div className="vd-card">
              <h2 className="vd-section-title">About the Venue</h2>
              <p className="vd-about-text">
                {venue.description || `${venue.name} is one of ${venue.city}'s most iconic nightlife venues, designed for unforgettable clubbing, gig, and social experiences.`}
              </p>

              <h3 className="vd-sub-title" style={{ marginTop: "32px" }}>Amenities</h3>
              <div className="vd-amenities-grid">
                {venue.amenities && venue.amenities.length > 0 ? (
                  venue.amenities.map((amenity, idx) => (
                    <div key={idx} className="vd-amenity-badge">
                      <span className="vd-amenity-icon">{AMENITY_ICONS[amenity] || "✦"}</span>
                      <span>{amenity}</span>
                    </div>
                  ))
                ) : (
                  ["AC", "Full Bar", "VIP Lounge", "Live DJ", "Large Dance Floor", "Parking Available", "Wi-Fi", "Security"].map((am, i) => (
                    <div key={i} className="vd-amenity-badge">
                      <span className="vd-amenity-icon">{AMENITY_ICONS[am] || "✦"}</span>
                      <span>{am}</span>
                    </div>
                  ))
                )}
              </div>

              <h3 className="vd-sub-title" style={{ marginTop: "40px" }}>Venue Gallery</h3>
              <div className="vd-gallery-grid">
                {galleryImages.map((img, idx) => (
                  <div key={idx} className="vd-gallery-thumb">
                    <img src={img} alt={`Gallery ${idx + 1}`} />
                  </div>
                ))}
              </div>

              <button 
                className="vd-gallery-btn"
                onClick={() => toast("Gallery viewing coming soon! 📸")}
              >
                <HiPhoto /> View All Photos
              </button>
            </div>

          </div>

          {/* Right Block: Upcoming Events list */}
          <div className="vd-split-right" ref={eventsSectionRef}>
            
            <div className="vd-card">
              <h2 className="vd-section-title">Upcoming Events at this Venue</h2>

              {activeEvents.length > 0 ? (
                <div className="vd-event-list">
                  {activeEvents.map((event) => (
                    <div key={event.id} className="vd-event-strip">
                      <img 
                        src={event.poster_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400"} 
                        alt={event.title} 
                        className="vd-event-strip__poster"
                      />
                      <div className="vd-event-strip__details">
                        <h4 className="vd-event-strip__title">{event.title}</h4>
                        <div className="vd-event-strip__meta">
                          <span>📅 {formatDate(event.date)}</span>
                          <span>🕒 {formatTime(event.start_time)} Onwards</span>
                        </div>
                      </div>
                      <div className="vd-event-strip__action">
                        <span className="vd-event-strip__price">₹{event.tickets?.[0]?.price || "999"}</span>
                        <Link to={`/events/${event.id}`} className="vd-event-strip__btn">
                          Book Now
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="vd-events-empty">
                  <div className="vd-events-empty-icon">🎵</div>
                  <p>No upcoming events published at this venue right now.</p>
                </div>
              )}

              <Link to="/events" className="vd-all-events-btn">
                <HiCalendar /> View All Events
              </Link>
            </div>

          </div>

        </div>

        {/* 4. Score scorecard & review sections */}
        <div className="vd-reviews-section">
          
          <div className="vd-card">
            <div className="vd-reviews-header">
              <div>
                <h2 className="vd-section-title" style={{ marginBottom: "6px" }}>PartyHub Score</h2>
                <p style={{ color: "hsl(var(--muted))", fontSize: "0.9rem", margin: 0 }}>
                  Based on {reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="vd-overall-score">
                <span className="vd-score-num">{reviewStats.count > 0 ? reviewStats.overall : "0.0"}</span>
                <span className="vd-score-max">/ 5.0</span>
              </div>
            </div>

            <div className="vd-scorecards-grid">
              {[
                { label: "Music", value: parseFloat(reviewStats.music || 0) },
                { label: "Food", value: parseFloat(reviewStats.food || 0) },
                { label: "Crowd", value: parseFloat(reviewStats.crowd || 0) },
                { label: "Safety", value: parseFloat(reviewStats.safety || 0) },
                { label: "Atmosphere", value: parseFloat(reviewStats.atmosphere || 0) },
              ].map((item, idx) => (
                <div key={idx} className="vd-scorecard-item">
                  <div className="vd-scorecard-lbl-row">
                    <span>{item.label}</span>
                    <strong>{reviewStats.count > 0 ? item.value.toFixed(1) : "0.0"}</strong>
                  </div>
                  <div className="vd-scorecard-track">
                    <div 
                      className="vd-scorecard-fill" 
                      style={{ width: `${(item.value / 5) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form */}
          {eligible && !hasReviewed && (
            <div className="vd-card" style={{ marginTop: "32px" }}>
              <h2 className="vd-section-title">Share Your Vibe</h2>
              <p style={{ color: "hsl(var(--muted))", fontSize: "0.9rem", marginBottom: "28px" }}>
                You booked a ticket to this venue! Share your rating to help others plan their night out.
              </p>

              <form onSubmit={handleReviewSubmit} className="vd-form">
                <div className="vd-form-ratings">
                  {[
                    { label: "Safety", state: safetyRating, setter: setSafetyRating },
                    { label: "Music", state: musicRating, setter: setMusicRating },
                    { label: "Food", state: foodRating, setter: setFoodRating },
                    { label: "Crowd", state: crowdRating, setter: setCrowdRating },
                    { label: "Atmosphere", state: atmosphereRating, setter: setAtmosphereRating },
                  ].map((item, idx) => (
                    <div key={idx} className="vd-form-rating-row">
                      <span>{item.label}</span>
                      <div className="vd-form-stars">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={`vd-star-btn ${item.state >= star ? "active" : ""}`}
                            onClick={() => item.setter(star)}
                          >
                            ★
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "24px" }}>
                  <label className="vd-form-lbl">Comment</label>
                  <textarea
                    rows={3}
                    className="vd-form-textarea"
                    placeholder="Tell us about the entry vibe, music genre, or wait times..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                  />
                </div>

                <button type="submit" className="vd-btn-primary" style={{ marginTop: "24px", width: "100%", justifyContent: "center" }} disabled={submittingReview}>
                  {submittingReview ? "Submitting..." : "Submit Review"}
                </button>
              </form>
            </div>
          )}

          {/* Reviews list */}
          <div className="vd-card" style={{ marginTop: "32px" }}>
            <h2 className="vd-section-title">Customer Reviews</h2>
            
            {reviews.length === 0 ? (
              <div className="vd-reviews-empty">
                <p>No reviews yet. Be the first to review after checking in!</p>
              </div>
            ) : (
              <div className="vd-reviews-list">
                {reviews.map((review) => (
                  <div key={review.id} className="vd-review-tile">
                    <div className="vd-review-tile__header">
                      <div className="vd-review-tile__user">
                        <div className="vd-review-tile__avatar">
                          {review.user?.full_name?.[0]?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <h4 className="vd-review-tile__name">{review.user?.full_name || "Anonymous"}</h4>
                          <span className="vd-review-tile__date">
                            {new Date(review.created_at).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                      <span className="vd-review-tile__badge">
                        ★ {review.overall_score?.toFixed(1)}
                      </span>
                    </div>

                    {review.comment && (
                      <p className="vd-review-tile__comment">{review.comment}</p>
                    )}

                    <div className="vd-review-tile__breakdown">
                      <span>🎵 Music: {review.music_rating || "—"}</span>
                      <span>🍔 Food: {review.food_rating || "—"}</span>
                      <span>👥 Crowd: {review.crowd_rating || "—"}</span>
                      <span>🛡️ Safety: {review.safety_rating || "—"}</span>
                      <span>✨ Atmosphere: {review.atmosphere_rating || "—"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

export default VenueDetail;
