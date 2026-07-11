import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiMapPin, HiCalendar, HiClock, HiTicket, HiCheckCircle, HiMiniInformationCircle, HiSparkles } from "react-icons/hi2";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./MyBookings.css";

function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("passes");
  const [bookings, setBookings] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login?redirect=/my-bookings");
      return;
    }

    fetchData();
  }, [user, authLoading, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [bookingsRes, reservationsRes] = await Promise.all([
        api.get("/bookings/my-bookings"),
        api.get("/table-reservations/my")
      ]);

      if (bookingsRes.data?.success) {
        setBookings(bookingsRes.data.data);
      }
      if (reservationsRes.data?.success) {
        setReservations(reservationsRes.data.data);
      }
    } catch (err) {
      console.error("Failed to load bookings or reservations:", err);
      toast.error("Could not load your records");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:${minutes} ${suffix}`;
  };

  const getStatusBadge = (status) => {
    const configs = {
      pending: { label: "Pending Review ⏳", class: "status-pending" },
      confirmed: { label: "Confirmed 🍽️", class: "status-approved" },
      declined: { label: "Declined ❌", class: "status-rejected" },
      cancelled: { label: "Cancelled 📁", class: "status-revoked" }
    };
    const config = configs[status] || { label: status, class: "" };
    return <span className={`vd-aftermeter__badge ${config.class}`}>{config.label}</span>;
  };

  if (authLoading || loading) {
    return (
      <div className="my-bookings-page">
        <div className="my-bookings-container">
          <div className="venue-detail__loading-spinner" style={{ margin: "100px auto" }} />
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-container">
        
        <header className="my-bookings-header">
          <h1>My <em>Reservations & Tickets</em></h1>
          <p>Manage your entry passes and table reservations verified by AfterDark.</p>
        </header>

        {/* Tab Navigator */}
        <div className="venues-tabs" style={{ marginBottom: "32px", justifyContent: "center" }}>
          <button 
            className={`venues-tab-btn ${activeTab === "passes" ? "active" : ""}`}
            onClick={() => setActiveTab("passes")}
          >
            🎟️ Event Passes ({bookings.length})
          </button>
          <button 
            className={`venues-tab-btn ${activeTab === "tables" ? "active" : ""}`}
            onClick={() => setActiveTab("tables")}
          >
            🍽️ Table Bookings ({reservations.length})
          </button>
        </div>

        {/* ── TAB 1: EVENT PASSES ── */}
        {activeTab === "passes" && (
          bookings.length === 0 ? (
            <div className="ticket-stub__empty">
              <h3>No tickets found</h3>
              <p>You haven't booked any event tickets yet. Explore trending events in your city!</p>
              <Link to="/events" className="ed-pricing__book-btn" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center", width: "auto", padding: "12px 30px", marginTop: "20px" }}>
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="tickets-list">
              {bookings.map((booking) => {
                const event = booking.event || {};
                const venue = event.venue || {};
                const checkInUrl = `${window.location.origin}/owner/check-in/${booking.booking_code}`;
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(checkInUrl)}&color=000&bgcolor=fff`;

                return (
                  <div key={booking.id} className="ticket-stub">
                    <div className="ticket-stub__info">
                      <img
                        src={event.poster_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500"}
                        alt={event.title}
                        className="ticket-stub__poster"
                      />

                      <div className="ticket-stub__details">
                        <h2 className="ticket-stub__title">{event.title}</h2>
                        <p className="ticket-stub__venue">{venue.name}</p>

                        <div className="ticket-stub__meta-group">
                          <div className="ticket-stub__meta-item">
                            <HiCalendar />
                            <span>{formatDate(event.date)}</span>
                          </div>
                          <div className="ticket-stub__meta-item">
                            <HiClock />
                            <span>{formatTime(event.start_time)}</span>
                          </div>
                          <div className="ticket-stub__meta-item">
                            <HiMapPin />
                            <span>{venue.city}</span>
                          </div>
                        </div>

                        <div>
                          <span className="ticket-stub__tier">
                            {booking.tier_type} · {booking.quantity} Pass{booking.quantity > 1 ? "es" : ""}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="ticket-stub__tear-line">
                      <div className="ticket-stub__notch-top" />
                      <div className="ticket-stub__notch-bottom" />
                    </div>

                    <div className="ticket-stub__receipt">
                      <div className="ticket-stub__qr-placeholder">
                        <img src={qrUrl} alt={`QR Code for booking ${booking.booking_code}`} />
                      </div>
                      <span className="ticket-stub__serial">Serial Pass</span>
                      <span className="ticket-stub__code">{booking.booking_code}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {/* ── TAB 2: TABLE RESERVATIONS ── */}
        {activeTab === "tables" && (
          reservations.length === 0 ? (
            <div className="ticket-stub__empty">
              <h3>No table reservations</h3>
              <p>You haven't requested any table reservations yet. Book a table at your favorite lounge!</p>
              <Link to="/venues" className="ed-pricing__book-btn" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center", width: "auto", padding: "12px 30px", marginTop: "20px" }}>
                Browse Venues
              </Link>
            </div>
          ) : (
            <div className="tickets-list">
              {reservations.map((reserve) => {
                const venue = reserve.venue || {};
                
                return (
                  <div key={reserve.id} className="ticket-stub table-reservation-stub">
                    <div className="ticket-stub__info" style={{ padding: "24px" }}>
                      <div className="ticket-stub__details" style={{ width: "100%" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", width: "100%", flexWrap: "wrap", gap: "12px" }}>
                          <div>
                            <span style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", color: "#f59e0b", letterSpacing: "1px" }}>
                              Table Reservation ({reserve.occasion})
                            </span>
                            <h2 className="ticket-stub__title" style={{ marginTop: "4px", fontSize: "1.45rem" }}>{venue.name}</h2>
                          </div>
                          {getStatusBadge(reserve.status)}
                        </div>

                        <div className="ticket-stub__meta-group" style={{ margin: "20px 0" }}>
                          <div className="ticket-stub__meta-item">
                            <HiCalendar />
                            <span>{formatDate(reserve.reservation_date)}</span>
                          </div>
                          <div className="ticket-stub__meta-item">
                            <HiClock />
                            <span>{formatTime(reserve.reservation_time)}</span>
                          </div>
                          <div className="ticket-stub__meta-item">
                            <HiMapPin />
                            <span>{venue.city}</span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", padding: "12px 16px", background: "#1a1a24", borderRadius: "8px", border: "1px solid var(--border)" }}>
                          <div style={{ fontSize: "0.82rem" }}>
                            <span style={{ color: "hsl(var(--muted))", display: "block", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Guests</span>
                            <strong>{reserve.guest_count} Guest{reserve.guest_count > 1 ? "s" : ""}</strong>
                          </div>
                          <div style={{ fontSize: "0.82rem" }}>
                            <span style={{ color: "hsl(var(--muted))", display: "block", fontSize: "0.72rem", textTransform: "uppercase", fontWeight: 600 }}>Preferred Area</span>
                            <strong style={{ textTransform: "capitalize" }}>{reserve.seating_area?.replace("_", " ")}</strong>
                          </div>
                        </div>

                        {reserve.special_requests && (
                          <div style={{ marginTop: "14px", fontSize: "0.82rem", color: "rgba(255, 255, 255, 0.75)" }}>
                            <span style={{ color: "hsl(var(--muted))", fontWeight: 600, display: "block" }}>Requests:</span>
                            <p style={{ margin: "4px 0 0 0", fontStyle: "italic" }}>"{reserve.special_requests}"</p>
                          </div>
                        )}

                        <div style={{ marginTop: "16px", display: "flex", gap: "12px", fontSize: "0.75rem", color: "hsl(var(--muted))" }}>
                          <span>Address: <strong>{venue.address}</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

      </div>
    </div>
  );
}

export default MyBookings;
