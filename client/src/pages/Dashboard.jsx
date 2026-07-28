import { useState, useEffect } from "react";
import { HiBuildingStorefront, HiCalendarDays, HiListBullet, HiArrowLeftOnRectangle, HiTicket, HiCamera } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "../lib/supabase";
import MyVenue from "../components/dashboard/MyVenue";
import CreateEvent from "../components/dashboard/CreateEvent";
import AnalyticsHub from "../components/dashboard/AnalyticsHub";
import GateScanner from "../components/dashboard/GateScanner";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./Dashboard.css";

function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("venue");
  const [isVerified, setIsVerified] = useState(true);
  const [venueId, setVenueId] = useState(null);

  // Tab routing listener
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam && ["venue", "create-event", "events", "tables", "analytics", "scanner"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location]);

  // Owner events & guestlist check-in states
  const [ownerEvents, setOwnerEvents] = useState([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [fetchingAttendees, setFetchingAttendees] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState("");

  // Table reservation states
  const [reservations, setReservations] = useState([]);
  const [fetchingReservations, setFetchingReservations] = useState(false);
  const [reservationFilter, setReservationFilter] = useState("active");

  useEffect(() => {
    if (activeTab === "events" && user) {
      fetchOwnerEvents();
    }
    if (activeTab === "tables" && venueId) {
      fetchVenueReservations();
    }
  }, [activeTab, user, venueId]);

  const fetchOwnerEvents = async () => {
    try {
      setFetchingEvents(true);
      const res = await api.get("/owner/events");
      if (res.data?.success) {
        setOwnerEvents(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load events:", err);
      toast.error("Could not load your events");
    } finally {
      setFetchingEvents(false);
    }
  };

  const fetchVenueReservations = async () => {
    try {
      setFetchingReservations(true);
      const res = await api.get(`/table-reservations/venue/${venueId}`);
      if (res.data?.success) {
        setReservations(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load table reservations:", err);
      toast.error("Could not load table reservations. Please make sure the table exists.");
    } finally {
      setFetchingReservations(false);
    }
  };

  const handleUpdateReservationStatus = async (reservationId, status) => {
    const toastId = toast.loading(`Updating status to ${status}...`);
    try {
      const res = await api.put(`/table-reservations/${reservationId}/status`, { status });
      if (res.data?.success) {
        toast.success(`Reservation ${status}! 🍽️`, { id: toastId });
        
        // Update local reservations state
        setReservations((prev) =>
          prev.map((r) =>
            r.id === reservationId ? { ...r, status } : r
          )
        );
      }
    } catch (err) {
      console.error("Error updating reservation status:", err);
      toast.error(err.response?.data?.error || "Failed to update reservation", { id: toastId });
    }
  };

  const handleViewGuestlist = async (event) => {
    setSelectedEvent(event);
    try {
      setFetchingAttendees(true);
      const res = await api.get(`/owner/events/${event.id}/attendees`);
      if (res.data?.success) {
        setAttendees(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load attendees:", err);
      toast.error("Could not load guestlist");
    } finally {
      setFetchingAttendees(false);
    }
  };

  const handleCheckIn = async (bookingCode) => {
    const toastId = toast.loading("Checking in guest...");
    try {
      const res = await api.put(`/owner/bookings/${bookingCode}/check-in`);
      if (res.data?.success) {
        toast.success("Guest checked in successfully! 🥂", { id: toastId });
        
        // Update attendees check-in status
        setAttendees((prev) =>
          prev.map((b) =>
            b.booking_code === bookingCode
              ? { ...b, status: "checked_in", checked_in_at: new Date().toISOString() }
              : b
          )
        );

        // Update events booked count details dynamically
        setOwnerEvents((prev) =>
          prev.map((e) =>
            e.id === selectedEvent.id
              ? { ...e, booked_count: e.booked_count }
              : e
          )
        );
      }
    } catch (err) {
      console.error("Check-in error:", err);
      toast.error(err.response?.data?.error || "Check-in failed", { id: toastId });
    }
  };

  useEffect(() => {
    if (loading) return;

    if (!user) {
      navigate("/owner/login");
      return;
    }

    if (profile && profile.role !== "venue_owner" && profile.role !== "admin") {
      navigate("/");
      toast.error("Access denied. Partner Portal is for venue owners only.");
      return;
    }

    // Check if venue exists — redirect to setup if not
    const checkVenue = async () => {
      const { data: venue } = await supabase
        .from("venues")
        .select("id, is_verified")
        .eq("owner_id", user.id)
        .single();

      if (!venue) {
        navigate("/owner/setup");
      } else {
        setVenueId(venue.id);
        setIsVerified(venue.is_verified);
      }
    };
    checkVenue();
  }, [user, profile, loading, navigate]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      navigate("/owner/login");
    } catch (err) {
      toast.error("Logout failed");
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

  if (loading) {
    return <div className="dashboard-page"><p style={{ color: "white", padding: "40px" }}>Loading...</p></div>;
  }

  return (
    <div className="dashboard-page">
      {/* Main Content */}
      <main className="dashboard-main">
        {!isVerified && (
          <div className="venue-warning-banner" style={{ marginBottom: "28px" }}>
            <div className="venue-warning-banner__icon">⚠️</div>
            <div className="venue-warning-banner__content">
              <h3>Pending Verification</h3>
              <p>Your venue registration is currently under review by our admin team. Any events you publish will not be visible to customers until your account is approved.</p>
            </div>
          </div>
        )}

        {/* Dashboard Title & Tabs Navigation Header */}
        <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: 0, color: "white" }}>Partner Dashboard</h1>
            <p style={{ margin: "4px 0 0 0", color: "hsl(var(--muted))", fontSize: "0.95rem" }}>
              Update venue details, publish events, and manage attendees or table bookings.
            </p>
          </div>
          <button 
            onClick={handleLogout} 
            className="dashboard-logout-btn"
          >
            <HiArrowLeftOnRectangle style={{ fontSize: "1.1rem" }} /> Sign Out
          </button>
        </header>

        {/* Tabs Bar */}
        <div className="dashboard-tabs">
          <button
            className={`dashboard-tab ${activeTab === "venue" ? "active" : ""}`}
            onClick={() => setActiveTab("venue")}
          >
            <HiBuildingStorefront style={{ marginRight: "8px", verticalAlign: "middle", display: "inline" }} />
            My Venue
          </button>
          <button
            className={`dashboard-tab ${activeTab === "create-event" ? "active" : ""}`}
            onClick={() => setActiveTab("create-event")}
          >
            <HiCalendarDays style={{ marginRight: "8px", verticalAlign: "middle", display: "inline" }} />
            Create Event
          </button>
          <button
            className={`dashboard-tab ${activeTab === "events" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("events");
              setSelectedEvent(null);
            }}
          >
            <HiListBullet style={{ marginRight: "8px", verticalAlign: "middle", display: "inline" }} />
            My Events
          </button>
          <button
            className={`dashboard-tab ${activeTab === "tables" ? "active" : ""}`}
            onClick={() => setActiveTab("tables")}
          >
            <HiTicket style={{ marginRight: "8px", verticalAlign: "middle", display: "inline" }} />
            Table Bookings
          </button>
          <button
            className={`dashboard-tab ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            <span style={{ marginRight: "8px", verticalAlign: "middle", display: "inline" }}>📊</span>
            Analytics
          </button>
          <button
            className={`dashboard-tab ${activeTab === "scanner" ? "active" : ""}`}
            onClick={() => setActiveTab("scanner")}
          >
            <HiCamera style={{ marginRight: "8px", verticalAlign: "middle", display: "inline" }} />
            Gate Scanner
          </button>
        </div>

        {activeTab === "venue" && <MyVenue />}
        {activeTab === "create-event" && <CreateEvent />}
        
        {/* TAB 3: EVENTS */}
        {activeTab === "events" && (
          <div>
            <h2 style={{ fontSize: "1.5rem", color: "white", marginBottom: "6px", textAlign: "left" }}>My Events</h2>
            <p style={{ color: "hsl(var(--muted))", fontSize: "0.88rem", marginBottom: "28px", textAlign: "left" }}>Manage your published events and track guestlists.</p>

            {fetchingEvents ? (
              <p style={{ color: "white" }}>Loading events...</p>
            ) : ownerEvents.length === 0 ? (
              <div className="dashboard-placeholder">
                <h2>No Events Published</h2>
                <p>You haven't created any events yet. Go to "Create Event" to get started!</p>
              </div>
            ) : (
              <div className="owner-events-grid">
                {ownerEvents.map((event) => (
                  <div key={event.id} className="owner-event-card">
                    <h3 className="owner-event-card__title">{event.title}</h3>
                    <p className="owner-event-card__date">
                      {new Date(event.date).toLocaleDateString("en-IN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                    <p className="owner-event-card__spots">
                      {event.booked_count} / {event.total_capacity} booked
                    </p>
                    <div className="owner-event-card__actions">
                      <button
                        className="owner-event-card__btn"
                        onClick={() => handleViewGuestlist(event)}
                      >
                        View Guestlist
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: TABLE RESERVATIONS */}
        {activeTab === "tables" && (() => {
          const todayStr = new Date().toISOString().split("T")[0];

          const activeReservations = reservations.filter((r) => {
            const isCancelledOrDeclined = r.status === "cancelled" || r.status === "declined";
            const isPast = r.reservation_date < todayStr;
            return !isCancelledOrDeclined && !isPast;
          });

          const historyReservations = reservations.filter((r) => {
            const isCancelledOrDeclined = r.status === "cancelled" || r.status === "declined";
            const isPast = r.reservation_date < todayStr;
            return isCancelledOrDeclined || isPast;
          });

          const displayedReservations = reservationFilter === "active" ? activeReservations : historyReservations;

          return (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
                <div>
                  <h2 style={{ fontSize: "1.5rem", color: "white", marginBottom: "6px", textAlign: "left" }}>Table Bookings</h2>
                  <p style={{ color: "hsl(var(--muted))", fontSize: "0.88rem", margin: 0, textAlign: "left" }}>Manage guest dinner and lunch table reservations for your venue.</p>
                </div>

                {/* Filter Toggle Pills */}
                <div style={{ display: "flex", gap: "8px", background: "rgba(255, 255, 255, 0.04)", padding: "4px", borderRadius: "20px", border: "1px solid var(--border)" }}>
                  <button
                    type="button"
                    onClick={() => setReservationFilter("active")}
                    style={{
                      background: reservationFilter === "active" ? "linear-gradient(135deg, var(--primary), var(--secondary))" : "transparent",
                      color: "white",
                      border: "none",
                      borderRadius: "16px",
                      padding: "6px 16px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    🟢 Active & Upcoming ({activeReservations.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReservationFilter("history")}
                    style={{
                      background: reservationFilter === "history" ? "rgba(255, 255, 255, 0.12)" : "transparent",
                      color: reservationFilter === "history" ? "white" : "hsl(var(--muted))",
                      border: "none",
                      borderRadius: "16px",
                      padding: "6px 16px",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    📁 History & Cancelled ({historyReservations.length})
                  </button>
                </div>
              </div>

              {fetchingReservations ? (
                <p style={{ color: "white" }}>Loading reservations...</p>
              ) : displayedReservations.length === 0 ? (
                <div className="dashboard-placeholder">
                  <h2>{reservationFilter === "active" ? "No Active Table Bookings" : "No Past / Cancelled History"}</h2>
                  <p>{reservationFilter === "active" ? "New active table requests will appear here." : "Cancelled or expired past table reservations will be archived here."}</p>
                </div>
              ) : (
                <div className="owner-tables-grid">
                  {displayedReservations.map((reserve) => {
                  const guestName = reserve.guest?.full_name || "Anonymous";
                  const initials = guestName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "?";
                  
                  // Status config
                  const statusColors = {
                    pending: "pending",
                    confirmed: "confirmed",
                    declined: "declined",
                    cancelled: "cancelled"
                  };
                  const cardStatusClass = statusColors[reserve.status] || "";

                  // Emojis for seating area
                  const areaEmojis = {
                    main_lounge: "🛋️",
                    rooftop: "🌃",
                    vip_booth: "👑",
                    poolside: "🌊",
                    bar_seats: "🍸"
                  };
                  const areaLabel = reserve.seating_area?.replace("_", " ") || "Seating";
                  const areaEmoji = areaEmojis[reserve.seating_area] || "🪑";

                  // Emojis for occasions
                  const occasionEmojis = {
                    dinner: "🍽️ Dinner",
                    lunch: "☀️ Lunch",
                    birthday: "🎂 Birthday",
                    date: "👩‍❤️‍👨 Date Night",
                    casual: "🍻 Casual Drinks",
                    business: "🤝 Business",
                    other: "🌟 Other"
                  };
                  const occasionLabel = occasionEmojis[reserve.occasion] || `🌟 ${reserve.occasion}`;

                  return (
                    <div key={reserve.id} className={`owner-table-card ${cardStatusClass}`}>
                      {/* Top colored strip */}
                      <div className="owner-table-card__glow-header" />

                      {/* Header row */}
                      <div className="owner-table-card__header">
                        <div className="owner-table-card__guest-info">
                          <div className="owner-table-card__avatar">{initials}</div>
                          <div className="owner-table-card__guest-details">
                            <h4>{guestName}</h4>
                            <p>{reserve.guest?.phone || "No phone"}</p>
                          </div>
                        </div>
                        <span className={`guestlist-badge guestlist-badge--${reserve.status}`}>
                          {reserve.status}
                        </span>
                      </div>

                      {/* Badges row */}
                      <div className="owner-table-card__badge-row">
                        <span className="owner-table-card__badge occasion">
                          {occasionLabel}
                        </span>
                        <span className="owner-table-card__badge area" style={{ textTransform: "capitalize" }}>
                          {areaEmoji} {areaLabel}
                        </span>
                      </div>

                      {/* Table code neon selector display */}
                      {reserve.table_code && (
                        <div className={`owner-table-card__code-display ${cardStatusClass}`}>
                          <span className="owner-table-card__code-label">Assigned Spot</span>
                          <span className={`owner-table-card__code-value ${cardStatusClass}`}>
                            Table {reserve.table_code}
                          </span>
                        </div>
                      )}

                      {/* Info grid */}
                      <div className="owner-table-card__details">
                        <div className="owner-table-card__detail-item">
                          <span className="owner-table-card__detail-label">Date</span>
                          <span className="owner-table-card__detail-val">
                            📅 {formatDate(reserve.reservation_date)}
                          </span>
                        </div>
                        <div className="owner-table-card__detail-item">
                          <span className="owner-table-card__detail-label">Time</span>
                          <span className="owner-table-card__detail-val">
                            ⏰ {formatTime(reserve.reservation_time)}
                          </span>
                        </div>
                        <div className="owner-table-card__detail-item">
                          <span className="owner-table-card__detail-label">Guests Count</span>
                          <span className="owner-table-card__detail-val">
                            👥 {reserve.guest_count} Guest{reserve.guest_count > 1 ? "s" : ""}
                          </span>
                        </div>
                        <div className="owner-table-card__detail-item">
                          <span className="owner-table-card__detail-label">Email</span>
                          <span className="owner-table-card__detail-val" style={{ fontSize: "0.72rem", overflow: "hidden", textOverflow: "ellipsis", display: "block", whiteSpace: "nowrap" }} title={reserve.guest?.email}>
                            ✉️ {reserve.guest?.email || "No email"}
                          </span>
                        </div>
                      </div>

                      {/* Special requests */}
                      {reserve.special_requests && (
                        <div className="owner-table-card__requests">
                          "{reserve.special_requests}"
                        </div>
                      )}

                      {/* Actions */}
                      <div className="owner-table-card__actions">
                        {reserve.status === "pending" ? (
                          <>
                            <button
                              className="owner-table-card__btn accept"
                              onClick={() => handleUpdateReservationStatus(reserve.id, "confirmed")}
                            >
                              Accept
                            </button>
                            <button
                              className="owner-table-card__btn decline"
                              onClick={() => handleUpdateReservationStatus(reserve.id, "declined")}
                            >
                              Decline
                            </button>
                          </>
                        ) : reserve.status === "confirmed" ? (
                          <button
                            className="owner-table-card__btn cancel"
                            onClick={() => handleUpdateReservationStatus(reserve.id, "cancelled")}
                          >
                            Cancel Booking
                          </button>
                        ) : (
                          <div style={{ width: "100%", textAlign: "center", fontSize: "0.78rem", color: "hsl(var(--muted))", fontWeight: 700, padding: "8px 0", background: "rgba(255,255,255,0.02)", borderRadius: "6px" }}>
                            Resolved
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          );
        })()}

        {/* TAB 5: ANALYTICS */}
        {activeTab === "analytics" && <AnalyticsHub venueId={venueId} />}

        {/* TAB 6: GATE SCANNER */}
        {activeTab === "scanner" && <GateScanner />}

        {/* Guestlist Details Modal */}
        {selectedEvent && (
          <div className="guestlist-overlay">
            <div className="guestlist-modal">
              <button
                className="guestlist-modal__close"
                onClick={() => {
                  setSelectedEvent(null);
                  setAttendees([]);
                  setAttendeeSearch("");
                }}
              >
                ✕
              </button>

              <h2 className="guestlist-modal__title">{selectedEvent.title}</h2>
              <p className="guestlist-modal__subtitle">Guestlist & Verification</p>

              {/* Stats Bar */}
              <div className="guestlist-stats">
                <div className="guestlist-stat-card">
                  <span className="guestlist-stat-card__label">Total Bookings</span>
                  <span className="guestlist-stat-card__val">
                    {selectedEvent.booked_count} / {selectedEvent.total_capacity}
                  </span>
                </div>
                <div className="guestlist-stat-card">
                  <span className="guestlist-stat-card__label">Checked In</span>
                  <span className="guestlist-stat-card__val">
                    {attendees.filter((a) => a.status === "checked_in").length} / {attendees.length}
                  </span>
                </div>
              </div>

              {/* Search Bar */}
              <div className="guestlist-search-container">
                <input
                  type="text"
                  placeholder="Search guests by name or booking code..."
                  value={attendeeSearch}
                  onChange={(e) => setAttendeeSearch(e.target.value)}
                />
              </div>

              {/* Guestlist Table */}
              <div className="guestlist-list-wrapper">
                {fetchingAttendees ? (
                  <p style={{ padding: "20px", color: "white" }}>Loading guestlist...</p>
                ) : attendees.length === 0 ? (
                  <p style={{ padding: "30px", color: "hsl(var(--muted))", textAlign: "center" }}>
                    No bookings found for this event yet.
                  </p>
                ) : (
                  <table className="guestlist-table">
                    <thead>
                      <tr>
                        <th>Guest Name</th>
                        <th>Email</th>
                        <th>Tier</th>
                        <th>Quantity</th>
                        <th>Booking Code</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendees
                        .filter((b) => {
                          const query = attendeeSearch.toLowerCase();
                          return (
                            b.user?.full_name?.toLowerCase().includes(query) ||
                            b.booking_code?.toLowerCase().includes(query) ||
                            b.user?.email?.toLowerCase().includes(query)
                          );
                        })
                        .map((booking) => (
                          <tr key={booking.id}>
                            <td>{booking.user?.full_name || "Unknown"}</td>
                            <td>{booking.user?.email || "No email"}</td>
                            <td style={{ textTransform: "uppercase", fontSize: "0.78rem" }}>
                              {booking.tier_type}
                            </td>
                            <td>{booking.quantity}</td>
                            <td style={{ fontWeight: 700, letterSpacing: "0.5px" }}>
                              {booking.booking_code}
                            </td>
                            <td>
                              <span
                                className={`guestlist-badge guestlist-badge--${booking.status}`}
                              >
                                {booking.status === "checked_in" ? "Checked In" : "Confirmed"}
                              </span>
                            </td>
                            <td>
                              {booking.status === "checked_in" ? (
                                <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted))" }}>
                                  {new Date(booking.checked_in_at).toLocaleTimeString("en-IN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                              ) : (
                                <button
                                  className="guestlist-checkin-btn"
                                  onClick={() => handleCheckIn(booking.booking_code)}
                                >
                                  Check In
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
