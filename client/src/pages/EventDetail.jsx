import { useState, useEffect, useRef } from "react";
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
  HiUsers,
  HiUserPlus,
  HiHeart,
  HiSparkles
} from "react-icons/hi2";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import EventCard from "../components/ui/EventCard";
import toast from "react-hot-toast";
import "./EventDetail.css";

function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [event, setEvent] = useState(null);
  const [relatedEvents, setRelatedEvents] = useState([]);
  const [selectedTier, setSelectedTier] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isFavorited, setIsFavorited] = useState(false);

  // Booking states
  const [quantity, setQuantity] = useState(1);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);

  // Payment mock states
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");

  // Squad states
  const [squads, setSquads] = useState([]);
  const [fetchingSquads, setFetchingSquads] = useState(false);
  const [showCreateSquad, setShowCreateSquad] = useState(false);
  const [squadName, setSquadName] = useState("");

  const fetchEventSquads = async () => {
    try {
      setFetchingSquads(true);
      const res = await api.get(`/squads/event/${id}`);
      if (res.data?.success) {
        setSquads(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load squads:", err);
    } finally {
      setFetchingSquads(false);
    }
  };

  const handleCreateSquad = async (e) => {
    e.preventDefault();
    if (!squadName.trim()) return;

    try {
      const res = await api.post("/squads", {
        name: squadName,
        event_id: id,
      });

      if (res.data?.success) {
        toast.success("Squad launched! 🍻");
        setSquadName("");
        setShowCreateSquad(false);
        navigate(`/squads/${res.data.data.id}`);
      }
    } catch (err) {
      console.error("Failed to create squad:", err);
      toast.error(err.response?.data?.error || "Failed to create squad");
    }
  };

  const handleBookClick = () => {
    if (!user) {
      toast.error("Please sign in to book event tickets!");
      navigate(`/login?redirect=/events/${id}`);
      return;
    }
    
    if (event.booked_count + quantity > event.total_capacity) {
      toast.error("Not enough spots left for this quantity!");
      return;
    }
    
    setCheckoutOpen(true);
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (!cardNumber || !expiry || !cvv) {
      toast.error("Please fill in all payment details");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/bookings", {
        event_id: event.id,
        tier_type: event.pricing[selectedTier].type,
        quantity,
      });

      if (res.data?.success) {
        toast.success("Booking confirmed! 🎟️");
        setBookingResult(res.data.data.booking_code);
        setEvent((prev) => ({
          ...prev,
          booked_count: (prev.booked_count || 0) + quantity,
        }));
      }
    } catch (err) {
      console.error("Booking transaction failed:", err);
      toast.error(err.response?.data?.error || "Transaction failed. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Fetch event data ──
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/events/${id}`);
        setEvent(res.data.data);

        // Fetch related events
        if (res.data.data.venue_id) {
          const relRes = await api.get("/events/trending");
          const related = relRes.data.data
            .filter((e) => e.id !== id)
            .slice(0, 3);
          setRelatedEvents(related);
        }
      } catch (err) {
        console.error("Failed to fetch event:", err);
        toast.error("Event not found");
        navigate("/events");
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
    fetchEventSquads();
    window.scrollTo(0, 0);
  }, [id, navigate]);

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
    if (pct >= 80)
      return { label: "Packed 🔥", color: "#ef4444", pct };
    if (pct >= 45)
      return { label: "Filling Fast ⚡", color: "#f59e0b", pct };
    return { label: "Spots Open ✨", color: "#10b981", pct };
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
        // Cancelled
      }
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied to clipboard! 📋");
    }
  };

  if (loading) {
    return (
      <div className="venue-detail__loading">
        <div className="venue-detail__loading-spinner" />
      </div>
    );
  }

  if (!event) return null;

  const vibe = getVibeLevel(event.booked_count, event.total_capacity);
  const spotsLeft = event.total_capacity - event.booked_count;
  const venue = event.venues || {};

  // Build Google Maps link
  const mapsUrl =
    venue.latitude && venue.longitude
      ? `https://www.google.com/maps?q=${venue.latitude},${venue.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          (venue.address || "") + ", " + (venue.city || "")
        )}`;

  // Find lowest price
  const lowestPrice = event.pricing && event.pricing.length > 0
    ? Math.min(...event.pricing.map((p) => p.price))
    : 0;

  // Active pricing tier calculation
  const currentTierPrice = event.pricing && event.pricing[selectedTier]
    ? event.pricing[selectedTier].price
    : 0;
  
  // Student discount calculations
  const isEligibleForStudentDiscount = profile?.is_student && event.is_student_deal;
  const baseTotal = currentTierPrice * quantity;
  const studentDiscountAmount = isEligibleForStudentDiscount
    ? Math.round(baseTotal * (event.student_discount_percent / 100))
    : 0;
  const finalPrice = baseTotal - studentDiscountAmount;

  return (
    <div className="ed-redesign-page">
      <div className="ed-redesign-container">
        
        {/* Back navigation */}
        <button className="ed-back-btn" onClick={() => navigate(-1)}>
          <HiArrowLeft /> Back to Events
        </button>

        {/* 1. Main Split Grid (Poster & Booking Widget) */}
        <div className="ed-main-grid">
          
          {/* Left Column: Cover Poster image frame */}
          <div className="ed-poster-col">
            <div className="ed-poster-frame">
              <img 
                src={event.poster_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800"} 
                alt={event.title} 
              />
              <button 
                className={`ed-favorite-btn ${isFavorited ? "active" : ""}`}
                onClick={() => {
                  setIsFavorited(!isFavorited);
                  toast.success(isFavorited ? "Removed from Favorites" : "Saved to Favorites! 💜");
                }}
              >
                <HiHeart />
              </button>
              <div className="ed-type-badge">
                {formatType(event.event_type)}
              </div>
              <div className="ed-location-badge">
                <HiMapPin /> {venue.name || "Secret Venue"}
              </div>
            </div>
          </div>

          {/* Right Column: Title, metadata, and booking selector */}
          <div className="ed-booking-col">
            <div className="ed-booking-card">
              
              <div className="ed-title-row">
                <h1 className="ed-title">{event.title}</h1>
                <button className="ed-share-btn" onClick={handleShare} title="Share Link">
                  <HiShare />
                </button>
              </div>

              {/* Badges */}
              <div className="ed-badge-row">
                {event.is_student_deal && (
                  <span className="ed-student-badge">
                    🎓 {event.student_discount_percent}% Student Deal
                  </span>
                )}
                {spotsLeft <= 15 && spotsLeft > 0 && (
                  <span className="ed-urgent-badge">
                    ⚠️ Only {spotsLeft} passes left!
                  </span>
                )}
              </div>

              {/* Quick Meta */}
              <div className="ed-meta-group">
                <div className="ed-meta-item">
                  <span className="ed-meta-lbl">Date</span>
                  <span className="ed-meta-val">📅 {formatDate(event.date)}</span>
                </div>
                <div className="ed-meta-item">
                  <span className="ed-meta-lbl">Timings</span>
                  <span className="ed-meta-val">🕒 {formatTime(event.start_time)} - {formatTime(event.end_time)}</span>
                </div>
                <div className="ed-meta-item">
                  <span className="ed-meta-lbl">Location</span>
                  <span className="ed-meta-val">📍 {venue.city || "Bangalore"}</span>
                </div>
              </div>

              {/* Pass Selector widget */}
              <div className="ed-pass-box">
                <h3 className="ed-pass-box__title">Select your pass</h3>
                
                {event.pricing && event.pricing.length > 0 ? (
                  <div className="ed-pass-list">
                    {event.pricing.map((tier, idx) => (
                      <div 
                        key={idx} 
                        className={`ed-pass-tile ${selectedTier === idx ? "active" : ""}`}
                        onClick={() => setSelectedTier(idx)}
                      >
                        <div className="ed-pass-tile__radio">
                          <div className="ed-pass-tile__dot" />
                        </div>
                        <div className="ed-pass-tile__info">
                          <span className="ed-pass-tile__name">{tier.type}</span>
                          <span className="ed-pass-tile__desc">Access pass tier details</span>
                        </div>
                        <span className="ed-pass-tile__price">₹{tier.price}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "hsl(var(--muted))", fontSize: "0.88rem" }}>No passes available</p>
                )}

                {/* Quantity controller */}
                <div className="ed-qty-row">
                  <span className="ed-qty-lbl">Quantity</span>
                  <div className="ed-qty-controls">
                    <button 
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>
                    <span>{quantity}</span>
                    <button 
                      onClick={() => setQuantity(Math.min(5, quantity + 1))}
                      disabled={quantity >= 5}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Checkout pricing details */}
                {isEligibleForStudentDiscount && (
                  <div className="ed-discount-summary">
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "hsl(var(--muted))", marginBottom: "4px" }}>
                      <span>Subtotal</span>
                      <span>₹{baseTotal}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", color: "#10b981", fontWeight: 700 }}>
                      <span>🎓 Student Discount (-{event.student_discount_percent}%)</span>
                      <span>-₹{studentDiscountAmount}</span>
                    </div>
                  </div>
                )}

                {/* Submit button */}
                <button 
                  className="ed-book-btn" 
                  onClick={handleBookClick}
                  disabled={spotsLeft <= 0}
                >
                  <HiTicket style={{ fontSize: "1.2rem" }} /> 
                  {spotsLeft <= 0 
                    ? "Sold Out ❌" 
                    : `Book ${quantity} Pass${quantity > 1 ? "es" : ""} — ₹${finalPrice}`}
                </button>
              </div>

            </div>
          </div>

        </div>

        {/* 2. Detailed Grid (Description, Squads, Vibe Meter) */}
        <div className="ed-split-grid">
          
          {/* Left Block: Description & Squads */}
          <div className="ed-split-left">
            
            <div className="ed-card">
              <h2 className="ed-section-title">About this event</h2>
              <p className="ed-about-text">
                {event.description || "Get ready for an epic night filled with the best beats, amazing drinks, and an electric atmosphere. Bring your crew and let's make it a night to remember!"}
              </p>

              {event.tags && event.tags.length > 0 && (
                <div className="ed-tags-wrapper">
                  {event.tags.map((tag, idx) => (
                    <span key={idx} className="ed-tag-badge">#{tag}</span>
                  ))}
                </div>
              )}

              {/* Squads widget */}
              <div className="ed-squads-box">
                <div className="ed-squads-header">
                  <div>
                    <h3 className="ed-sub-title" style={{ marginBottom: "2px" }}>Squad Coordinator</h3>
                    <p style={{ color: "hsl(var(--muted))", fontSize: "0.8rem", margin: 0 }}>Join a crew or start your own to party together!</p>
                  </div>
                  <button className="ed-launch-squad-btn" onClick={() => setShowCreateSquad(!showCreateSquad)}>
                    <HiUsers /> Launch a Crew
                  </button>
                </div>

                {showCreateSquad && (
                  <form onSubmit={handleCreateSquad} className="ed-squad-form">
                    <input 
                      type="text" 
                      placeholder="Enter crew name..."
                      value={squadName}
                      onChange={(e) => setSquadName(e.target.value)}
                    />
                    <button type="submit">Create</button>
                  </form>
                )}

                {fetchingSquads ? (
                  <p style={{ color: "hsl(var(--muted))", fontSize: "0.85rem" }}>Loading squads...</p>
                ) : squads.length === 0 ? (
                  <div className="ed-squads-empty">
                    <p>No active squads for this event yet. Be the first to start a crew!</p>
                  </div>
                ) : (
                  <div className="ed-squads-list">
                    {squads.map((squad) => (
                      <div key={squad.id} className="ed-squad-strip">
                        <div>
                          <h4 className="ed-squad-name">{squad.name}</h4>
                          <span className="ed-squad-host">Hosted by {squad.host?.full_name || "Friend"}</span>
                        </div>
                        <Link to={`/squads/${squad.id}`} className="ed-squad-join-btn">
                          <HiUserPlus /> View & Join
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>

          {/* Right Block: Vibe Meter & Venue Spotlight */}
          <div className="ed-split-right">
            
            {/* Vibe Meter */}
            <div className="ed-card">
              <h2 className="ed-section-title">Party Meter™</h2>
              
              <div className="ed-vibemeter">
                <div className="ed-vibemeter__header">
                  <span className="ed-vibemeter__lbl" style={{ color: vibe.color }}>
                    {vibe.label}
                  </span>
                  <span className="ed-vibemeter__pct">{vibe.pct}% Capacity</span>
                </div>
                
                <div className="ed-vibemeter__track">
                  <div 
                    className="ed-vibemeter__fill" 
                    style={{ width: `${vibe.pct}%`, background: vibe.color }}
                  />
                </div>

                <div className="ed-vibemeter__footer">
                  <span>Spots Taken: <strong>{event.booked_count}</strong></span>
                  <span>Total Capacity: <strong>{event.total_capacity}</strong></span>
                </div>
              </div>
            </div>

            {/* Venue Spotlight card */}
            <div className="ed-card" style={{ marginTop: "24px" }}>
              <h2 className="ed-section-title">Venue Spotlight</h2>
              <div className="ed-spotlight-venue">
                <h3 className="ed-spotlight-name">{venue.name || "Secret Club"}</h3>
                <p className="ed-spotlight-address">📍 {venue.address}, {venue.city}</p>
                <div className="ed-spotlight-row">
                  <span className="ed-spotlight-lbl">Timings</span>
                  <span className="ed-spotlight-val">🕒 {formatTime(venue.opening_time)} - {formatTime(venue.closing_time)}</span>
                </div>
                <div className="ed-spotlight-row">
                  <span className="ed-spotlight-lbl">Contact</span>
                  <span className="ed-spotlight-val">{venue.phone || "+91 98765 43210"}</span>
                </div>
                <a href={mapsUrl} target="_blank" rel="noreferrer" className="ed-spotlight-maps-btn">
                  <HiArrowTopRightOnSquare /> Get Directions
                </a>
              </div>
            </div>

          </div>

        </div>

        {/* 3. Related events (Bottom list slider) */}
        {relatedEvents.length > 0 && (
          <div className="ed-related-section">
            <h2 className="ed-related-title">
              <HiSparkles style={{ color: "#7d5cfc", marginRight: "8px", verticalAlign: "middle" }} />
              More Events You'll Love
            </h2>
            <div className="ed-related-grid">
              {relatedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}

      </div>

      {/* 4. Checkout payment overlay portal */}
      {checkoutOpen && (
        <div className="ed-modal-overlay" onClick={() => setCheckoutOpen(false)}>
          <div className="ed-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ed-modal-header">
              <h2>Secure Pass Checkout</h2>
              <button className="ed-modal-close" onClick={() => setCheckoutOpen(false)}>&times;</button>
            </div>
            
            {!bookingResult ? (
              <form onSubmit={handleCheckoutSubmit} className="ed-checkout-form">
                <div className="ed-checkout-summary">
                  <div className="ed-checkout-row">
                    <span>Ticket Type</span>
                    <strong>{event.pricing[selectedTier].type}</strong>
                  </div>
                  <div className="ed-checkout-row">
                    <span>Quantity</span>
                    <strong>{quantity}</strong>
                  </div>
                  <div className="ed-checkout-row border-top">
                    <span>Total Price</span>
                    <strong style={{ color: "var(--primary-light)" }}>₹{finalPrice}</strong>
                  </div>
                </div>

                <div className="ed-card-fields">
                  <div className="create-event__field">
                    <label>Card Number</label>
                    <input 
                      type="text" 
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      maxLength={19}
                      required
                    />
                  </div>
                  <div className="ed-card-row">
                    <div className="create-event__field">
                      <label>Expiry Date</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        maxLength={5}
                        required
                      />
                    </div>
                    <div className="create-event__field">
                      <label>CVV</label>
                      <input 
                        type="password" 
                        placeholder="123"
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        maxLength={3}
                        required
                      />
                    </div>
                  </div>
                </div>

                <button type="submit" className="ed-checkout-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? "Processing Payment..." : `Pay ₹${finalPrice}`}
                </button>
              </form>
            ) : (
              <div className="ed-booking-success">
                <span className="success-icon">🎟️</span>
                <h2>Pass Secured!</h2>
                <p>Your payment was verified. Show the QR Pass at the door for gate check-in.</p>
                <div className="booking-code-box">
                  <span>Booking Code</span>
                  <strong>{bookingResult}</strong>
                </div>
                <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                  <Link to="/my-bookings" className="ed-success-btn">
                    View My Tickets
                  </Link>
                  <button className="ed-success-btn secondary" onClick={() => {
                    setCheckoutOpen(false);
                    setBookingResult(null);
                    setCardNumber("");
                    setExpiry("");
                    setCvv("");
                  }}>
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default EventDetail;
