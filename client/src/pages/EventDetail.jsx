import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  HiMapPin,
  HiCalendar,
  HiClock,
  HiTicket,
  HiArrowLeft,
  HiShare,
  HiFire,
  HiArrowTopRightOnSquare,
} from "react-icons/hi2";
import api from "../lib/api";
import EventCard from "../components/ui/EventCard";
import toast from "react-hot-toast";
import "./EventDetail.css";

// 🧠 LEARN: useParams() hook
// React Router gives us the :id from the URL "/events/:id"
// So if the URL is /events/abc-123, useParams() returns { id: "abc-123" }

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [selectedTier, setSelectedTier] = useState(0);
  const [loading, setLoading] = useState(true);

  // ── Fetch event data ──
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/events/${id}`);
        setEvent(res.data.data);

        // Fetch related events from the same venue
        if (res.data.data.venue_id) {
          const relRes = await api.get("/events/trending");
          // Filter out current event and show others from same venue first
          const related = relRes.data.data
            .filter((e) => e.id !== id)
            .slice(0, 4);
          setRelatedEvents(related);
        }
      } catch (err) {
        console.error("Failed to fetch event:", err);
        toast.error("Event not found");
        navigate("/");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
    window.scrollTo(0, 0);
  }, [id, navigate]);

  // ── Helper functions ──
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return minutes === "00"
      ? `${display} ${suffix}`
      : `${display}:${minutes} ${suffix}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatType = (type) => {
    const labels = {
      club_night: "Club Night",
      live_music: "Live Music",
      standup: "Comedy",
      open_mic: "Open Mic",
      gaming: "Gaming",
      festival: "Festival",
    };
    return labels[type] || type;
  };

  const getVibeLevel = (booked, total) => {
    const pct = Math.round((booked / total) * 100);
    if (pct >= 75)
      return { label: "🔴 Packed", color: "var(--meter-packed)", pct };
    if (pct >= 40)
      return { label: "🟡 Moderate", color: "var(--meter-moderate)", pct };
    return { label: "🟢 Chill", color: "var(--meter-chill)", pct };
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: `Check out ${event.title} on AfterDark!`,
          url,
        });
      } catch {
        // User cancelled — do nothing
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard! 📋");
    }
  };

  // ── Loading State ──
  if (loading) {
    return (
      <div className="event-detail event-detail--loading">
        <div style={{ textAlign: "center" }}>
          <div
            className="skeleton ed-skeleton-hero"
            style={{ width: "100vw", borderRadius: 0 }}
          />
        </div>
      </div>
    );
  }

  if (!event) return null;

  const vibe = getVibeLevel(event.booked_count, event.total_capacity);
  const spotsLeft = event.total_capacity - event.booked_count;
  const lowestPrice = event.pricing
    ? Math.min(...event.pricing.map((p) => p.price))
    : 0;

  return (
    <div className="event-detail">
      {/* ═══════════════════════════
         HERO SECTION
       ═══════════════════════════ */}
      <motion.section
        className="ed-hero"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        {/* Back button */}
        <button className="ed-back-btn" onClick={() => navigate(-1)}>
          <HiArrowLeft /> Back
        </button>

        <img
          src={event.poster_url}
          alt={event.title}
          className="ed-hero__image"
        />
        <div className="ed-hero__overlay" />

        {/* Badges */}
        <div className="ed-hero__badges">
          <span className="ed-hero__type-badge">
            {formatType(event.event_type)}
          </span>
          {event.is_student_deal && (
            <span className="ed-hero__student-badge">
              🎓 {event.student_discount_percent}% Student Deal
            </span>
          )}
        </div>

        {/* Title + Meta */}
        <div className="ed-hero__content">
          <h1 className="ed-hero__title">{event.title}</h1>
          <div className="ed-hero__meta">
            {event.venues && (
              <span className="ed-hero__meta-pill">
                <HiMapPin />
                {event.venues.name}, {event.venues.city}
              </span>
            )}
            <span className="ed-hero__meta-pill">
              <HiCalendar />
              {formatDate(event.date)}
            </span>
            <span className="ed-hero__meta-pill">
              <HiClock />
              {formatTime(event.start_time)} — {formatTime(event.end_time)}
            </span>
          </div>
        </div>
      </motion.section>

      {/* ═══════════════════════════
         MAIN CONTENT (2-col grid)
       ═══════════════════════════ */}
      <div className="ed-content">
        {/* ── Left Column ── */}
        <motion.div
          className="ed-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          {/* About */}
          <div className="ed-about">
            <p className="ed-about__label">About this event</p>
            <p className="ed-about__text">{event.description}</p>
          </div>

          {/* Tags */}
          {event.tags && event.tags.length > 0 && (
            <div className="ed-tags">
              {event.tags.map((tag, i) => (
                <span key={i} className="ed-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Related Events */}
          {relatedEvents.length > 0 && (
            <div className="ed-related">
              <p className="ed-related__label">More events you'll love</p>
              <div className="ed-related__grid">
                {relatedEvents.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Right Column ── */}
        <motion.div
          className="ed-right"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          {/* Pricing Tiers */}
          {event.pricing && event.pricing.length > 0 && (
            <div className="ed-pricing">
              <p className="ed-pricing__label">Select your pass</p>
              <div className="ed-pricing__tiers">
                {event.pricing.map((tier, i) => (
                  <div
                    key={i}
                    className={`ed-pricing__tier ${
                      selectedTier === i ? "ed-pricing__tier--selected" : ""
                    }`}
                    onClick={() => setSelectedTier(i)}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="ed-pricing__tier-radio" />
                      <div className="ed-pricing__tier-info">
                        <span className="ed-pricing__tier-label">
                          {tier.label}
                        </span>
                        <span className="ed-pricing__tier-type">
                          {tier.type}
                        </span>
                      </div>
                    </div>
                    <span className="ed-pricing__tier-price">₹{tier.price}</span>
                  </div>
                ))}
              </div>

              <button className="ed-pricing__book-btn">
                <HiTicket />
                Book Now — ₹{event.pricing[selectedTier]?.price}
              </button>
            </div>
          )}

          {/* Party Meter™ */}
          <div className="ed-meter">
            <p className="ed-meter__label">Party Meter™</p>
            <div className="ed-meter__status">
              <span className="ed-meter__vibe" style={{ color: vibe.color }}>
                {vibe.label}
              </span>
              <span className="ed-meter__spots">
                {spotsLeft} spots left
              </span>
            </div>
            <div className="ed-meter__bar">
              <div
                className="ed-meter__bar-fill"
                style={{
                  width: `${vibe.pct}%`,
                  background: vibe.color,
                }}
              />
            </div>
            <p className="ed-meter__percentage">
              {vibe.pct}% filled · {event.booked_count}/{event.total_capacity}{" "}
              booked
            </p>
          </div>

          {/* Venue Info Card */}
          {event.venues && (
            <div className="ed-venue">
              {event.venues.images && event.venues.images.length > 0 && (
                <img
                  src={event.venues.images[0]}
                  alt={event.venues.name}
                  className="ed-venue__image"
                />
              )}
              <div className="ed-venue__info">
                <h3 className="ed-venue__name">{event.venues.name}</h3>
                <span className="ed-venue__category">
                  {event.venues.category}
                </span>
                <div className="ed-venue__address">
                  <HiMapPin />
                  <span>
                    {event.venues.address}, {event.venues.city}
                    {event.venues.state ? `, ${event.venues.state}` : ""}
                  </span>
                </div>
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                    `${event.venues.name} ${event.venues.address} ${event.venues.city}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ed-venue__map-btn"
                >
                  <HiArrowTopRightOnSquare />
                  View on Maps
                </a>
              </div>
            </div>
          )}

          {/* Share Button */}
          <button className="ed-share-btn" onClick={handleShare}>
            <HiShare />
            Share this event
          </button>
        </motion.div>
      </div>

      {/* ═══════════════════════════
         STICKY MOBILE CTA
       ═══════════════════════════ */}
      <div className="ed-sticky-cta">
        <div className="ed-sticky-cta__price">
          <span>Starting from</span>
          ₹{lowestPrice}+
        </div>
        <button className="ed-sticky-cta__btn">
          Book Now
        </button>
      </div>
    </div>
  );
}

export default EventDetail;
