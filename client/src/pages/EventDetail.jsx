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
  HiSparkles,
  HiBell
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTier, setSelectedTier] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);

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

  // Split payment states
  const [isSplitPayment, setIsSplitPayment] = useState(false);
  const [splitSquadName, setSplitSquadName] = useState("");

  const [myEventSquad, setMyEventSquad] = useState(null);

  const fetchEventSquads = async () => {
    try {
      setFetchingSquads(true);
      const res = await api.get(`/squads/event/${id}`);
      if (res.data?.success) {
        setSquads(res.data.data);
      }

      // Check if user belongs to an active squad for this event
      if (user) {
        const myRes = await api.get("/squads/my/active");
        if (myRes.data?.success) {
          const match = myRes.data.data.find((s) => s.event_id === id || s.event?.id === id);
          if (match) setMyEventSquad(match);
        }
      }
    } catch (err) {
      console.error("Failed to load squads:", err);
    } finally {
      setFetchingSquads(false);
    }
  };

  const handleSetReminder = async (hours) => {
    if (!user) {
      toast.error("Please sign in to set event reminders!");
      navigate(`/login?redirect=/events/${id}`);
      return;
    }
    try {
      const res = await api.post("/notifications/remind", {
        event_id: event.id,
        event_title: event.title,
        reminder_hours: hours
      });
      if (res.data?.success) {
        toast.success(res.data.message || `Reminder set for ${hours} hour(s) before event! 🔔`);
        setShowReminderModal(false);
      }
    } catch (err) {
      console.error("Set reminder error:", err);
      toast.error(err.response?.data?.error || "Failed to set event reminder");
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

  const processBookingConfirmation = async (paymentId) => {
    try {
      const res = await api.post("/bookings", {
        event_id: event.id,
        tier_type: event.pricing[selectedTier].type,
        quantity,
        is_split_payment: isSplitPayment,
        squad_name: isSplitPayment ? splitSquadName : undefined,
        payment_id: paymentId,
      });

      if (res.data?.success) {
        if (isSplitPayment && res.data.data.squad) {
          const newSquadId = res.data.data.squad.id;
          const hostShareAmount = Math.ceil(finalPrice / Math.max(1, quantity));
          try {
            await api.post("/paylock/create", {
              squad_id: newSquadId,
              event_id: event.id,
              item_title: `Pass: ${event.title}`,
              total_target_amount: finalPrice,
              host_paid_amount: hostShareAmount,
              item_type: "ticket"
            });
          } catch (pErr) {
            console.warn("Paylock init notice:", pErr);
          }

          toast.success("Squad PayLock launched in Squad Chat! 💳");
          setCheckoutOpen(false);
          navigate(`/squads/${newSquadId}`);
        } else {
          toast.success("Booking confirmed via Razorpay! 🎟️");
          setBookingResult(res.data.data.booking_code);
          setEvent((prev) => ({
            ...prev,
            booked_count: (prev.booked_count || 0) + quantity,
          }));
        }
      }
    } catch (err) {
      console.error("Booking transaction failed:", err);
      toast.error(err.response?.data?.error || "Transaction failed. Try again.");
    }
  };

  const handleCheckoutSubmit = async (e) => {
    e.preventDefault();
    if (isSplitPayment && !splitSquadName.trim()) {
      toast.error("Please enter a Squad Name for the split checkout");
      return;
    }

    const hostShareAmount = Math.ceil(finalPrice / Math.max(1, quantity));
    const targetPayAmount = isSplitPayment ? hostShareAmount : finalPrice;

    try {
      setIsSubmitting(true);

      // 1. Create Razorpay Order on Backend
      const orderRes = await api.post("/payment/create-order", {
        amount: targetPayAmount,
        receipt: `rcpt_${Date.now()}`,
        notes: { event_id: event.id, is_split: isSplitPayment }
      });

      if (!orderRes.data?.success) {
        throw new Error(orderRes.data?.error || "Could not create Razorpay order");
      }

      const orderData = orderRes.data.data;

      // 2. Open Razorpay Native Popup Window
      if (window.Razorpay && orderData) {
        const options = {
          key: orderData.key_id || import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_THbll1AUnRwRMQ",
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "AfterDark Nightlife",
          description: isSplitPayment ? `PayLock Reserve — ${event.title}` : `Pass Booking — ${event.title}`,
          order_id: orderData.is_mock ? undefined : orderData.id,
          prefill: {
            name: profile?.full_name || "",
            email: user?.email || "",
          },
          theme: { color: "#ff007f" },
          handler: async function (response) {
            try {
              // Verify payment on backend
              const verifyRes = await api.post("/payment/verify", {
                razorpay_order_id: response.razorpay_order_id || orderData.id,
                razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
                razorpay_signature: response.razorpay_signature,
                is_mock: orderData.is_mock
              });

              if (verifyRes.data?.success) {
                await processBookingConfirmation(verifyRes.data.payment_id || response.razorpay_payment_id);
              } else {
                toast.error("Razorpay signature verification failed");
              }
            } catch (vErr) {
              console.error("Verification error:", vErr);
              toast.error("Payment verification failed");
            } finally {
              setIsSubmitting(false);
            }
          },
          modal: {
            ondismiss: function () {
              setIsSubmitting(false);
              toast("Payment window closed", { icon: "ℹ️" });
            }
          }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        // Fallback test verification
        const verifyRes = await api.post("/payment/verify", {
          razorpay_order_id: orderData?.id || `order_${Date.now()}`,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: "test_signature",
          is_mock: true
        });

        if (verifyRes.data?.success) {
          await processBookingConfirmation(verifyRes.data.payment_id);
        }
        setIsSubmitting(false);
      }

    } catch (err) {
      console.error("Checkout submit error:", err);
      toast.error(err.response?.data?.error || err.message || "Payment initiation failed");
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
                src={(event.poster_url && typeof event.poster_url === "string" && event.poster_url.trim() !== "") ? event.poster_url : "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800"} 
                alt={event.title || "Event Poster"} 
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
              
              {/* Active Squad Direct Chat Access */}
              {myEventSquad && (
                <div className="ed-my-squad-quick-chat" style={{ background: "rgba(125, 92, 252, 0.12)", border: "1px solid rgba(125, 92, 252, 0.3)", borderRadius: "14px", padding: "14px 18px", marginBottom: "20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ textDecoration: "none" }}>
                    <span style={{ fontSize: "0.72rem", color: "var(--primary-light)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>💬 Your Active Party Squad</span>
                    <h4 style={{ margin: "2px 0 0 0", color: "white", fontSize: "1.05rem", fontWeight: 800 }}>{myEventSquad.name}</h4>
                    {myEventSquad.last_message && (
                      <p style={{ margin: "4px 0 0 0", color: "hsl(var(--muted))", fontSize: "0.78rem" }}>
                        "{myEventSquad.last_message.user?.full_name?.split(' ')[0]}: {myEventSquad.last_message.message.slice(0, 25)}..."
                      </p>
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/squads/${myEventSquad.id}`)}
                    className="ed-pricing__book-btn"
                    style={{ width: "auto", padding: "8px 18px", fontSize: "0.85rem", whiteSpace: "nowrap" }}
                  >
                    💬 Open Squad Chat
                  </button>
                </div>
              )}

              <div className="ed-title-row">
                <h1 className="ed-title">{event.title}</h1>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button 
                    className="ed-share-btn" 
                    onClick={() => setShowReminderModal(true)} 
                    title="Set Start Reminder 🔔"
                    style={{ background: "rgba(255, 0, 127, 0.15)", color: "#ff007f", border: "1px solid rgba(255, 0, 127, 0.3)" }}
                  >
                    <HiBell />
                  </button>
                  <button className="ed-share-btn" onClick={handleShare} title="Share Link">
                    <HiShare />
                  </button>
                </div>
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
              <HiSparkles style={{ color: "var(--primary)", marginRight: "8px", verticalAlign: "middle" }} />
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

                {/* Bill Splitting Options */}
                <div style={{ marginBottom: "20px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", textAlign: "left" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", color: "white", fontWeight: 700, fontSize: "0.88rem" }}>
                    <input 
                      type="checkbox" 
                      checked={isSplitPayment}
                      onChange={(e) => {
                        setIsSplitPayment(e.target.checked);
                        if (e.target.checked && !splitSquadName) {
                          setSplitSquadName(`${profile?.full_name || "My"}'s Squad — ${event.title.slice(0, 10)}`);
                        }
                      }}
                      style={{ width: "18px", height: "18px", cursor: "pointer", accentColor: "var(--primary)" }}
                    />
                    <span>Split bill fractionally with my Crew 👥</span>
                  </label>
                  {isSplitPayment && (
                    <div className="create-event__field" style={{ marginTop: "12px" }}>
                      <label style={{ fontSize: "0.72rem", color: "hsl(var(--muted))" }}>Crew Squad Name</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Saturday Night Out"
                        value={splitSquadName}
                        onChange={(e) => setSplitSquadName(e.target.value)}
                        required={isSplitPayment}
                        style={{ marginTop: "4px" }}
                      />
                      <p style={{ color: "var(--primary-light)", fontSize: "0.75rem", margin: "8px 0 0 0", fontWeight: 700 }}>
                        ⚡ PayLock Escrow: You pay only your equal share (₹{Math.ceil(finalPrice / Math.max(1, quantity))}) now. Remaining ₹{finalPrice - Math.ceil(finalPrice / Math.max(1, quantity))} is split with squad members in Squad Chat.
                      </p>
                    </div>
                  )}
                </div>

                <div style={{ background: "rgba(255, 0, 127, 0.04)", border: "1px solid rgba(255, 0, 127, 0.2)", borderRadius: "14px", padding: "16px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "white", fontWeight: 700, fontSize: "0.9rem" }}>
                    <span style={{ fontSize: "1.3rem" }}>💳</span>
                    <span>Razorpay Secure Payment Gateway</span>
                  </div>
                  <p style={{ margin: "6px 0 0 0", color: "hsl(var(--muted))", fontSize: "0.8rem", textAlign: "left" }}>
                    Supports <strong>UPI (GPay, PhonePe, Paytm, BHIM)</strong>, Debit/Credit Cards, and NetBanking. Clicking below launches the Razorpay checkout popup window.
                  </p>
                </div>

                <button type="submit" className="ed-checkout-submit-btn" disabled={isSubmitting}>
                  {isSubmitting 
                    ? "Processing Payment..." 
                    : isSplitPayment 
                    ? `Reserve PayLock — Pay My Share (₹${Math.ceil(finalPrice / Math.max(1, quantity))})` 
                    : `Pay ₹${finalPrice}`}
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

      {/* 5. Event Reminder overlay portal */}
      {showReminderModal && (
        <div className="ed-modal-overlay" onClick={() => setShowReminderModal(false)}>
          <div className="ed-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
            <div className="ed-modal-header">
              <h2>🔔 Set Event Reminder</h2>
              <button className="ed-modal-close" onClick={() => setShowReminderModal(false)}>&times;</button>
            </div>
            <div style={{ padding: "20px 0", textAlign: "center" }}>
              <p style={{ color: "hsl(var(--muted))", fontSize: "0.88rem", marginBottom: "20px" }}>
                Choose when you want an alert before <strong>{event.title}</strong> begins:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <button
                  onClick={() => handleSetReminder(1)}
                  style={{
                    background: "linear-gradient(135deg, var(--primary), var(--secondary))",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.95rem"
                  }}
                >
                  ⏰ 1 Hour Before Event Starts
                </button>
                <button
                  onClick={() => handleSetReminder(2)}
                  style={{
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "14px 18px",
                    fontWeight: 700,
                    cursor: "pointer",
                    fontSize: "0.95rem"
                  }}
                >
                  ⏰ 2 Hours Before Event Starts
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default EventDetail;
