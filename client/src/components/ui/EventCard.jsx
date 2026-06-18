import { motion } from "framer-motion";
import {
  HiMapPin,
  HiCalendar,
  HiClock,
  HiTicket,
  HiUsers,
  HiFire,
} from "react-icons/hi2";
import "./EventCard.css";

// 🧠 LEARN: Reusable Components
// This EventCard is used everywhere — Home, Search, Venue Detail pages
// It receives an "event" object as a prop and renders a beautiful card
// Props = data passed from parent to child component (like function arguments)

function EventCard({ event }) {
  // 🧠 LEARN: Destructuring — pull out values from the event object
  const {
    title,
    event_type,
    poster_url,
    date,
    start_time,
    end_time,
    pricing,
    total_capacity,
    booked_count,
    is_student_deal,
    student_discount_percent,
    tags,
    venues, // This is the joined venue data from Supabase
  } = event;

  // Calculate fill percentage for the capacity bar
  const fillPercent = Math.round((booked_count / total_capacity) * 100);

  // Determine the vibe level based on how full the event is
  const getVibeLevel = () => {
    if (fillPercent >= 80) return { label: "🔥 Almost Full", color: "var(--meter-packed)" };
    if (fillPercent >= 50) return { label: "⚡ Filling Fast", color: "var(--meter-moderate)" };
    return { label: "✨ Spots Open", color: "var(--meter-chill)" };
  };

  const vibe = getVibeLevel();

  // Get lowest price from the pricing tiers
  const lowestPrice = pricing
    ? Math.min(...pricing.map((p) => p.price))
    : 0;

  // Format the event type for display
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

  // Format time from "21:00:00" → "9 PM"
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return minutes === "00" ? `${display} ${suffix}` : `${display}:${minutes} ${suffix}`;
  };

  // Format the date nicely
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";

    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <motion.div
      className="event-card"
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* ── Event Poster Image ── */}
      <div className="event-card__image-wrapper">
        <img
          src={poster_url}
          alt={title}
          className="event-card__image"
          loading="lazy"
        />

        {/* Overlay gradient for text readability */}
        <div className="event-card__image-overlay" />

        {/* Event type badge */}
        <span className="event-card__type-badge">{formatType(event_type)}</span>

        {/* Student deal badge */}
        {is_student_deal && (
          <span className="event-card__student-badge">
            🎓 {student_discount_percent}% Student Deal
          </span>
        )}

        {/* Date pill on the image */}
        <div className="event-card__date-pill">
          <HiCalendar />
          {formatDate(date)}
        </div>
      </div>

      {/* ── Event Info ── */}
      <div className="event-card__info">
        <h3 className="event-card__title">{title}</h3>

        {/* Venue + City */}
        {venues && (
          <div className="event-card__venue">
            <HiMapPin />
            <span>
              {venues.name}, {venues.city}
            </span>
          </div>
        )}

        {/* Time */}
        <div className="event-card__time">
          <HiClock />
          <span>
            {formatTime(start_time)} — {formatTime(end_time)}
          </span>
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="event-card__tags">
            {tags.slice(0, 3).map((tag, i) => (
              <span key={i} className="event-card__tag">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* ── Bottom Row: Price + Capacity ── */}
        <div className="event-card__footer">
          <div className="event-card__price">
            <HiTicket />
            <span>₹{lowestPrice}+</span>
          </div>

          <div className="event-card__capacity">
            <div className="event-card__vibe" style={{ color: vibe.color }}>
              {vibe.label}
            </div>
            <div className="event-card__progress-bar">
              <div
                className="event-card__progress-fill"
                style={{
                  width: `${fillPercent}%`,
                  background: vibe.color,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default EventCard;
