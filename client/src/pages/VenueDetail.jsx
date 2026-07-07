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
  const { id } = useParams();
  const navigate = useNavigate();

  const [venue, setVenue] = useState(null);
  const [loading, setLoading] = useState(true);

  // ── Fetch venue data ──
  useEffect(() => {
    const fetchVenue = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/venues/${id}`);
        setVenue(res.data.data);
      } catch (err) {
        console.error("Failed to fetch venue:", err);
        toast.error("Venue not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchVenue();
    window.scrollTo(0, 0);
  }, [id, navigate]);

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
