import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
} from "react-icons/hi2";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/ui/EventCard";
import toast from "react-hot-toast";
import "./VenueDetail.css";

// 🧠 LEARN: Category display mapping
// The DB stores short keys like "club", we display friendly names
const CATEGORY_LABELS = {
  club: "Club",
  cafe: "Café",
  bar: "Bar",
  restaurant: "Restaurant",
  concert_hall: "Concert Hall",
  outdoor: "Outdoor",
  other: "Venue",
};

// 🧠 LEARN: Mock PartyHub Score
// This will be replaced by real review data on Days 20–21
const MOCK_SCORE = {
  overall: 4.2,
  music: 4.5,
  food: 3.8,
  crowd: 4.0,
  safety: 4.6,
  atmosphere: 4.3,
  reviewCount: 47,
};

// Amenity icons map
const AMENITY_ICONS = {
  "VIP Lounge": "👑",
  "Full Bar": "🍸",
  "Rooftop": "🌃",
  "Live DJ": "🎧",
  "Dance Floor": "💃",
  "Parking": "🅿️",
  "Smoking Zone": "🚬",
  "AC": "❄️",
  "Outdoor Seating": "🪑",
  "Karaoke": "🎤",
  "Pool Table": "🎱",
  "Food Menu": "🍕",
  "Wi-Fi": "📶",
  "Private Rooms": "🚪",
};

function VenueDetail() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

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
        // Fetch venue info
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

  // ── Loading state ──
  if (loading) {
    return (
      <div className="venue-detail__loading">
        <div className="venue-detail__loading-spinner" />
      </div>
    );
  }

  if (!venue) return null;

  // Extract venue data
  const events = venue.events || [];
  const activeEvents = events.filter((e) => e.is_active);
  const heroImage =
    venue.images && venue.images.length > 0
      ? venue.images[0]
      : "https://images.unsplash.com/photo-1566417713940-fe7c8460ffd3?w=1200";

  // Build Google Maps link
  const mapsUrl =
    venue.latitude && venue.longitude
      ? `https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          venue.address + ", " + venue.city
        )}`;

  // Format time
  const formatTime = (time) => {
    if (!time) return "—";
    const [h, m] = time.split(":");
    const hour = parseInt(h);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className="venue-detail">
      {/* ═══════════════════════════
         HERO SECTION
       ═══════════════════════════ */}
      <div className="venue-hero">
        <img
          src={heroImage}
          alt={venue.name}
          className="venue-hero__image"
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1566417713940-fe7c8460ffd3?w=1200";
          }}
        />
        <div className="venue-hero__overlay" />

        {/* Back Button */}
        <motion.button
          className="venue-hero__back"
          onClick={() => navigate(-1)}
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
        >
          <HiArrowLeft /> Back
        </motion.button>

        {/* Hero Content */}
        <motion.div
          className="venue-hero__content"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="venue-hero__badges">
            <span className="venue-hero__category">
              {CATEGORY_LABELS[venue.category] || venue.category}
            </span>
            {venue.is_verified && (
              <span className="venue-hero__verified">
                <HiCheckBadge /> Verified
              </span>
            )}
          </div>
          <h1 className="venue-hero__title">{venue.name}</h1>
        </motion.div>
      </div>

      {/* ═══════════════════════════
         INFO BAR
       ═══════════════════════════ */}
      <motion.div
        className="venue-info-bar"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        {/* Address */}
        <div className="venue-info-bar__item">
          <div className="venue-info-bar__icon">
            <HiMapPin />
          </div>
          <div>
            <div className="venue-info-bar__label">Address</div>
            <div className="venue-info-bar__value">
              {venue.address}, {venue.city}
            </div>
          </div>
        </div>

        {/* Hours */}
        <div className="venue-info-bar__item">
          <div className="venue-info-bar__icon">
            <HiClock />
          </div>
          <div>
            <div className="venue-info-bar__label">Hours</div>
            <div className="venue-info-bar__value">
              {formatTime(venue.opening_time)} — {formatTime(venue.closing_time)}
            </div>
          </div>
        </div>

        {/* Phone */}
        {venue.phone && (
          <div className="venue-info-bar__item">
            <div className="venue-info-bar__icon">
              <HiPhone />
            </div>
            <div>
              <div className="venue-info-bar__label">Contact</div>
              <div className="venue-info-bar__value">
                <a href={`tel:${venue.phone}`}>{venue.phone}</a>
              </div>
            </div>
          </div>
        )}

        {/* Website */}
        {venue.website && (
          <div className="venue-info-bar__item">
            <div className="venue-info-bar__icon">
              <HiGlobeAlt />
            </div>
            <div>
              <div className="venue-info-bar__label">Website</div>
              <div className="venue-info-bar__value">
                <a href={venue.website} target="_blank" rel="noopener noreferrer">
                  Visit Site ↗
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* ═══════════════════════════
         ABOUT & AMENITIES
       ═══════════════════════════ */}
      <motion.div
        className="venue-about"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
      >
        {/* Description */}
        <div>
          <h2 className="venue-about__heading">About this venue</h2>
          <p className="venue-about__description">
            {venue.description ||
              `${venue.name} is a premier ${
                CATEGORY_LABELS[venue.category] || "venue"
              } located in ${venue.city}. Come experience the best nightlife, events, and entertainment.`}
          </p>
        </div>

        {/* Amenities */}
        <div>
          <h2 className="venue-about__heading">Amenities</h2>
          <div className="venue-amenities__grid">
            {venue.amenities && venue.amenities.length > 0 ? (
              venue.amenities.map((amenity, i) => (
                <motion.span
                  key={i}
                  className="venue-amenities__chip"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                >
                  {AMENITY_ICONS[amenity] || "✦"} {amenity}
                </motion.span>
              ))
            ) : (
              <span className="venue-amenities__chip">✦ Premium Venue</span>
            )}
          </div>
        </div>
      </motion.div>

      {/* ═══════════════════════════
         CTA ROW
       ═══════════════════════════ */}
      <motion.div
        className="venue-cta-row"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <button
          className="venue-cta-row__btn--follow"
          onClick={() => toast.success("You're now following this venue! 💜")}
        >
          <HiHeart /> Follow Venue
        </button>
        <button
          className="venue-cta-row__btn--reserve"
          onClick={() =>
            toast("Table reservations coming soon! 🪑", { icon: "🔜" })
          }
        >
          <HiCalendar /> Reserve Table
        </button>
      </motion.div>

      {/* ═══════════════════════════
         UPCOMING EVENTS
       ═══════════════════════════ */}
      <motion.section
        className="venue-events"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.55 }}
      >
        <h2 className="venue-events__heading">
          <HiSparkles style={{ display: "inline", verticalAlign: "middle", marginRight: 8, color: "var(--primary-light)" }} />
          Upcoming Events
        </h2>

        {activeEvents.length > 0 ? (
          <div className="venue-events__grid">
            {activeEvents.map((event, i) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.08 }}
              >
                <EventCard
                  event={{
                    ...event,
                    venues: {
                      id: venue.id,
                      name: venue.name,
                      city: venue.city,
                      images: venue.images,
                      category: venue.category,
                    },
                  }}
                />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="venue-events__empty">
            <div className="venue-events__empty-icon">🎵</div>
            <p>No upcoming events at this venue right now.</p>
          </div>
        )}
      </motion.section>

      {/* ═══════════════════════════
         PARTYHUB SCORE (MOCK)
       ═══════════════════════════ */}
      <motion.section
        className="venue-score"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
      >
        <div className="venue-score__card">
          <div className="venue-score__header">
            <h2 className="venue-score__title">
              <HiStar style={{ display: "inline", verticalAlign: "middle", marginRight: 8, color: "var(--warning)" }} />
              PartyHub Score
            </h2>
            <div className="venue-score__overall">
              <span className="venue-score__number">{MOCK_SCORE.overall}</span>
              <span className="venue-score__max">/ 5.0</span>
            </div>
          </div>

          <div className="venue-score__bars">
            {[
              { label: "Music", value: MOCK_SCORE.music, icon: <HiMusicalNote /> },
              { label: "Food", value: MOCK_SCORE.food, icon: "🍽️" },
              { label: "Crowd", value: MOCK_SCORE.crowd, icon: "👥" },
              { label: "Safety", value: MOCK_SCORE.safety, icon: "🛡️" },
              { label: "Atmosphere", value: MOCK_SCORE.atmosphere, icon: "✨" },
            ].map((item, i) => (
              <div key={i} className="venue-score-bar">
                <span className="venue-score-bar__label">{item.label}</span>
                <div className="venue-score-bar__track">
                  <motion.div
                    className="venue-score-bar__fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / 5) * 100}%` }}
                    transition={{ duration: 1, delay: 0.7 + i * 0.1 }}
                  />
                </div>
                <span className="venue-score-bar__value">{item.value}</span>
              </div>
            ))}
          </div>

          <p className="venue-score__subtitle">
            Based on {MOCK_SCORE.reviewCount} reviews · Full review system coming soon
          </p>
        </div>
      </motion.section>

      {/* ═══════════════════════════
         PARTYHUB SCORE & REVIEWS
       ═══════════════════════════ */}
      <motion.section
        className="venue-score"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.65 }}
      >
        <div className="venue-score__card">
          <div className="venue-score__header">
            <h2 className="venue-score__title">
              <HiStar style={{ display: "inline", verticalAlign: "middle", marginRight: 8, color: "var(--warning)" }} />
              PartyHub Score
            </h2>
            <div className="venue-score__overall">
              <span className="venue-score__number">
                {reviewStats.count > 0 ? reviewStats.overall : "0.0"}
              </span>
              <span className="venue-score__max">/ 5.0</span>
            </div>
          </div>

          <div className="venue-score__bars">
            {[
              { label: "Music", value: parseFloat(reviewStats.music || 0), icon: <HiMusicalNote /> },
              { label: "Food", value: parseFloat(reviewStats.food || 0), icon: "🍽️" },
              { label: "Crowd", value: parseFloat(reviewStats.crowd || 0), icon: "👥" },
              { label: "Safety", value: parseFloat(reviewStats.safety || 0), icon: "🛡️" },
              { label: "Atmosphere", value: parseFloat(reviewStats.atmosphere || 0), icon: "✨" },
            ].map((item, i) => (
              <div key={i} className="venue-score-bar">
                <span className="venue-score-bar__label">{item.label}</span>
                <div className="venue-score-bar__track">
                  <motion.div
                    className="venue-score-bar__fill"
                    initial={{ width: 0 }}
                    animate={{ width: `${(item.value / 5) * 100}%` }}
                    transition={{ duration: 1, delay: 0.7 + i * 0.1 }}
                  />
                </div>
                <span className="venue-score-bar__value">
                  {reviewStats.count > 0 ? item.value.toFixed(1) : "0.0"}
                </span>
              </div>
            ))}
          </div>

          <p className="venue-score__subtitle">
            Based on {reviewStats.count} review{reviewStats.count !== 1 ? "s" : ""}
          </p>
        </div>
      </motion.section>

      {/* Review Submission Form */}
      {eligible && !hasReviewed && (
        <motion.section
          className="venue-review-form-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="venue-review-form-card">
            <h3>Share Your Vibe</h3>
            <p>You booked a ticket to this venue! Share your rating to help others plan their night out.</p>
            
            <form onSubmit={handleReviewSubmit} className="venue-review-form">
              <div className="venue-review-form__grid">
                {[
                  { label: "Safety Rating", state: safetyRating, setter: setSafetyRating },
                  { label: "Music Rating", state: musicRating, setter: setMusicRating },
                  { label: "Food Rating", state: foodRating, setter: setFoodRating },
                  { label: "Crowd Rating", state: crowdRating, setter: setCrowdRating },
                  { label: "Atmosphere Rating", state: atmosphereRating, setter: setAtmosphereRating },
                ].map((item, index) => (
                  <div key={index} className="venue-review-form__row">
                    <label>{item.label}</label>
                    <div className="venue-review-form__stars">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={`venue-review-form__star ${item.state >= star ? "filled" : ""}`}
                          onClick={() => item.setter(star)}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="create-event__field" style={{ marginTop: "16px", textAlign: "left" }}>
                <label style={{ fontSize: "0.72rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "hsl(var(--muted))" }}>Comment</label>
                <textarea
                  rows={3}
                  placeholder="Tell us about the entry vibe, wait times, music genre, or drinks..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{
                    width: "100%",
                    background: "var(--glass-strong)",
                    border: "1px solid hsl(var(--stroke))",
                    borderRadius: "var(--radius-sm)",
                    color: "white",
                    padding: "10px 14px",
                    fontSize: "0.88rem",
                    resize: "vertical",
                    marginTop: "6px"
                  }}
                />
              </div>

              <button
                type="submit"
                className="venue-review-form__submit"
                disabled={submittingReview}
              >
                {submittingReview ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          </div>
        </motion.section>
      )}

      {/* Customer Reviews Feed */}
      <motion.section
        className="venue-reviews-feed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="venue-reviews-feed__heading">Customer Reviews</h2>
        {reviews.length === 0 ? (
          <div className="venue-events__empty">
            <p>No reviews yet. Be the first to review after checking in!</p>
          </div>
        ) : (
          <div className="venue-reviews-feed__list">
            {reviews.map((review) => (
              <div key={review.id} className="venue-review-card">
                <div className="venue-review-card__header">
                  <div className="venue-review-card__user">
                    <div className="venue-review-card__avatar">
                      {review.user?.avatar_url ? (
                        <img src={review.user.avatar_url} alt={review.user.full_name} />
                      ) : (
                        review.user?.full_name?.[0]?.toUpperCase() || "?"
                      )}
                    </div>
                    <div>
                      <h4 className="venue-review-card__name">{review.user?.full_name || "Anonymous User"}</h4>
                      <span className="venue-review-card__date">
                        {new Date(review.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="venue-review-card__rating">
                    ★ {review.overall_score?.toFixed(1)}
                  </div>
                </div>
                {review.comment && (
                  <p className="venue-review-card__comment">{review.comment}</p>
                )}
                {/* Micro scorecard ratings */}
                <div className="venue-review-card__metrics">
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
      </motion.section>

      {/* ═══════════════════════════
         LOCATION CARD
       ═══════════════════════════ */}
      <motion.section
        className="venue-location"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.75 }}
      >
        <div className="venue-location__card">
          <div className="venue-location__info">
            <HiMapPin className="venue-location__icon" />
            <span className="venue-location__text">
              {venue.address}, {venue.city}
              {venue.state ? `, ${venue.state}` : ""}
            </span>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="venue-location__maps"
          >
            <HiArrowTopRightOnSquare /> View on Maps
          </a>
        </div>
      </motion.section>
    </div>
  );
}

export default VenueDetail;
