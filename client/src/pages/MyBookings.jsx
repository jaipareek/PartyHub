import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiMapPin, HiCalendar, HiClock, HiTicket } from "react-icons/hi2";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./MyBookings.css";

function MyBookings() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }

    fetchBookings();
  }, [user, authLoading, navigate]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await api.get("/bookings/my-bookings");
      if (res.data?.success) {
        setBookings(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load bookings:", err);
      toast.error("Could not load your tickets");
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

  if (authLoading || loading) {
    return (
      <div className="my-bookings-page">
        <div className="my-bookings-container">
          <p>Loading your tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="my-bookings-page">
      <div className="my-bookings-container">
        <header className="my-bookings-header">
          <h1>My <em>Tickets</em></h1>
          <p>Your verified digital passes to events on AfterDark. Show these at the door for entry.</p>
        </header>

        {bookings.length === 0 ? (
          <div className="ticket-stub__empty">
            <h3>No tickets found</h3>
            <p>You haven't booked any events yet. Explore events and register your RSVP!</p>
            <Link to="/events" className="ed-pricing__book-btn" style={{ textDecoration: "none", display: "inline-flex", justifyContent: "center", width: "auto", padding: "12px 30px", marginTop: "20px" }}>
              Browse Events
            </Link>
          </div>
        ) : (
          <div className="tickets-list">
            {bookings.map((booking) => {
              const event = booking.event || {};
              const venue = event.venue || {};
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${booking.booking_code}&color=000&bgcolor=fff`;

              return (
                <div key={booking.id} className="ticket-stub">
                  {/* Left Column: Info */}
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

                  {/* Tear divider */}
                  <div className="ticket-stub__tear-line">
                    <div className="ticket-stub__notch-top" />
                    <div className="ticket-stub__notch-bottom" />
                  </div>

                  {/* Right Column: Receipt & QR */}
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
        )}
      </div>
    </div>
  );
}

export default MyBookings;
