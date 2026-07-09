import { useState, useEffect } from "react";
import { HiBuildingStorefront, HiCalendarDays, HiListBullet, HiArrowLeftOnRectangle } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import MyVenue from "../components/dashboard/MyVenue";
import CreateEvent from "../components/dashboard/CreateEvent";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./Dashboard.css";

function Dashboard() {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("venue");
  const [isVerified, setIsVerified] = useState(true);

  // Owner events & guestlist check-in states
  const [ownerEvents, setOwnerEvents] = useState([]);
  const [fetchingEvents, setFetchingEvents] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [attendees, setAttendees] = useState([]);
  const [fetchingAttendees, setFetchingAttendees] = useState(false);
  const [attendeeSearch, setAttendeeSearch] = useState("");

  useEffect(() => {
    if (activeTab === "events" && user) {
      fetchOwnerEvents();
    }
  }, [activeTab, user]);

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

  if (loading) {
    return <div className="dashboard-page"><p style={{ color: "white", padding: "40px" }}>Loading...</p></div>;
  }

  return (
    <div className="dashboard-page">
      {/* Sidebar */}
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar__brand">
          <span className="dashboard-sidebar__logo">AD</span>
          <span className="dashboard-sidebar__brand-text">AfterDark Owner</span>
        </div>

        <nav className="dashboard-sidebar__nav">
          <button
            className={`dashboard-sidebar__nav-item ${activeTab === "venue" ? "active" : ""}`}
            onClick={() => setActiveTab("venue")}
          >
            <HiBuildingStorefront />
            <span>My Venue</span>
          </button>

          <button
            className={`dashboard-sidebar__nav-item ${activeTab === "create-event" ? "active" : ""}`}
            onClick={() => setActiveTab("create-event")}
          >
            <HiCalendarDays />
            <span>Create Event</span>
          </button>

          <button
            className={`dashboard-sidebar__nav-item ${activeTab === "events" ? "active" : ""}`}
            onClick={() => setActiveTab("events")}
          >
            <HiListBullet />
            <span>My Events</span>
          </button>
        </nav>

        <div className="dashboard-sidebar__footer">
          <button className="dashboard-sidebar__logout" onClick={handleLogout}>
            <HiArrowLeftOnRectangle />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="dashboard-main">
        {!isVerified && (
          <div className="venue-warning-banner">
            <div className="venue-warning-banner__icon">⚠️</div>
            <div className="venue-warning-banner__content">
              <h3>Pending Verification</h3>
              <p>Your venue registration is currently under review by our admin team. Any events you publish will not be visible to customers until your account is approved.</p>
            </div>
          </div>
        )}
        {activeTab === "venue" && <MyVenue />}
        {activeTab === "create-event" && <CreateEvent />}
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
