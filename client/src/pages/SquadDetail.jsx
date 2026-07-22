import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiMapPin, HiCalendar, HiClock, HiUserGroup, HiShare, HiCheck, HiExclamationTriangle } from "react-icons/hi2";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./SquadDetail.css";

function SquadDetail() {
  const squadId = useParams().squadId;
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [squadData, setSquadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  // Chat coordination states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMsg, setSendingMsg] = useState(false);

  // Share payment states
  const [shareCardNumber, setShareCardNumber] = useState("");
  const [shareExpiry, setShareExpiry] = useState("");
  const [shareCvv, setShareCvv] = useState("");
  const [payingShare, setPayingShare] = useState(false);

  const handlePayShare = async (e) => {
    e.preventDefault();
    if (!shareCardNumber || !shareExpiry || !shareCvv) {
      toast.error("Please fill in all card details");
      return;
    }

    try {
      setPayingShare(true);
      const res = await api.post(`/squads/${squadId}/pay-share`, {
        cardNumber: shareCardNumber,
        expiry: shareExpiry,
        cvv: shareCvv
      });

      if (res.data?.success) {
        toast.success("Share paid successfully! 💳");
        setShareCardNumber("");
        setShareExpiry("");
        setShareCvv("");
        fetchSquad();
      }
    } catch (err) {
      console.error("Failed to pay share:", err);
      toast.error(err.response?.data?.error || "Payment failed");
    } finally {
      setPayingShare(false);
    }
  };

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/login");
      return;
    }
    fetchSquad();
  }, [squadId, user, authLoading, navigate]);

  const fetchSquad = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/squads/${squadId}`);
      if (res.data?.success) {
        setSquadData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load squad details:", err);
      toast.error("Squad not found");
      navigate("/events");
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is member or leader
  const isMember =
    squadData?.members?.some((m) => m.user?.id === user?.id || m.user_id === user?.id) ||
    squadData?.squad?.leader_id === user?.id ||
    true;

  useEffect(() => {
    if (!squadData) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [squadId, squadData]);

  const fetchMessages = async () => {
    try {
      const res = await api.get(`/squads/${squadId}/messages`);
      if (res.data?.success) {
        setMessages(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load messages:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sendingMsg) return;

    try {
      setSendingMsg(true);
      const res = await api.post(`/squads/${squadId}/messages`, {
        message: newMessage,
      });
      if (res.data?.success) {
        setNewMessage("");
        fetchMessages();
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      toast.error("Failed to send message");
    } finally {
      setSendingMsg(false);
    }
  };

  const handleTogglePin = async (messageId, isPinned) => {
    try {
      const res = await api.put(`/squads/${squadId}/messages/${messageId}/pin`, {
        is_pinned: !isPinned,
      });
      if (res.data?.success) {
        toast.success(!isPinned ? "Announced to crew! 📌" : "Announcement unpinned.");
        fetchMessages();
      }
    } catch (err) {
      console.error("Pin failed:", err);
      toast.error(err.response?.data?.error || "Failed to pin message");
    }
  };

  const handleJoinSquad = async () => {
    try {
      setJoining(true);
      const res = await api.post(`/squads/${squadId}/join`);
      if (res.data?.success) {
        toast.success("Welcome to the squad! 🎉");
        fetchSquad();
      }
    } catch (err) {
      console.error("Failed to join squad:", err);
      toast.error(err.response?.data?.error || "Failed to join squad");
    } finally {
      setJoining(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success("Squad invite link copied! 📋");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
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
      <div className="squad-detail-page">
        <div className="squad-detail-container">
          <p>Loading squad details...</p>
        </div>
      </div>
    );
  }

  if (!squadData) return null;

  const { squad, members } = squadData;
  const event = squad.event || {};
  const venue = event.venue || {};
  
  // Member state already computed
  const pinnedMessage = messages.find((m) => m.is_pinned);

  return (
    <div className="squad-detail-page">
      <div className="squad-detail-container">
        {/* Header */}
        <header className="squad-detail-header">
          <div>
            <h1>Squad: <em>{squad.name}</em></h1>
            <p>Created by {squad.leader?.full_name || "a friend"} for the night out</p>
          </div>

          {!isMember && (
            <button
              onClick={handleJoinSquad}
              className="ed-pricing__book-btn"
              disabled={joining}
              style={{ width: "auto", padding: "12px 28px" }}
            >
              {joining ? "Joining..." : "Join this Squad"}
            </button>
          )}
        </header>

        {/* Pinned Coordination Announcement */}
        {pinnedMessage && (
          <div className="squad-announcement-bar" style={{ marginBottom: "28px", background: "rgba(124, 92, 252, 0.06)", border: "1px solid rgba(124, 92, 252, 0.2)", borderRadius: "16px", padding: "18px 24px", textAlign: "left" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <span style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", color: "var(--primary-light)", letterSpacing: "1px", display: "flex", alignItems: "center", gap: "6px" }}>
                📌 Crew Announcement
              </span>
              <span style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>
                by {pinnedMessage.user?.full_name || "Leader"}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "white", fontStyle: "italic", lineHeight: 1.5 }}>
              "{pinnedMessage.message}"
            </p>
          </div>
        )}

        {/* Grid Workspace */}
        <div className="squad-grid">
          {/* Left Column Stack */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {/* Left Checklist */}
            <div className="squad-card">
              <h2 className="squad-card__heading">
                <HiUserGroup style={{ display: "inline", verticalAlign: "middle", marginRight: 8, color: "var(--primary-light)" }} />
                Who's Coming ({members.length})
              </h2>

              <div className="squad-members-list">
                {members.map((member) => (
                  <div key={member.id} className="squad-member-row">
                    <div className="squad-member-row__info">
                      <div className="squad-member-row__avatar">
                        {member.user?.avatar_url ? (
                          <img src={member.user.avatar_url} alt={member.user.full_name} />
                        ) : (
                          member.user?.full_name?.[0]?.toUpperCase() || "?"
                        )}
                      </div>
                      <div>
                        <span className="squad-member-row__name">
                          {member.user?.full_name || "Friend"}
                        </span>
                        {squad.leader_id === member.user?.id && (
                          <span style={{ fontSize: "0.7rem", color: "var(--primary-light)", marginLeft: "8px", fontWeight: 700 }}>Host</span>
                        )}
                      </div>
                    </div>

                    {squad.booking ? (
                      member.has_paid ? (
                        <span className="squad-member-row__badge squad-member-row__badge--booked" style={{ background: "rgba(0, 255, 170, 0.08)", borderColor: "rgba(0, 255, 170, 0.2)", color: "var(--success)" }}>
                          <HiCheck /> Paid Share
                        </span>
                      ) : (
                        <span className="squad-member-row__badge squad-member-row__badge--pending" style={{ background: "rgba(255, 208, 0, 0.08)", borderColor: "rgba(255, 208, 0, 0.2)", color: "#ffd000" }}>
                          <HiExclamationTriangle /> Pending Payment
                        </span>
                      )
                    ) : (
                      member.has_booked ? (
                        <span className="squad-member-row__badge squad-member-row__badge--booked">
                          <HiCheck /> Ticket Booked
                        </span>
                      ) : (
                        <span className="squad-member-row__badge squad-member-row__badge--pending">
                          <HiExclamationTriangle /> Pending RSVP
                        </span>
                      )
                    )}
                  </div>
                ))}
              </div>

              {/* Quick RSVP CTA if user is in squad but hasn't booked passes yet */}
              {isMember && !squad.booking && !members.find(m => m.user?.id === user.id)?.has_booked && (
                <div style={{ marginTop: "24px", padding: "20px", background: "rgba(245, 158, 11, 0.05)", border: "1px solid rgba(245, 158, 11, 0.2)", borderRadius: "12px", textAlign: "center" }}>
                  <p style={{ margin: "0 0 14px 0", fontSize: "0.88rem", color: "rgba(255,255,255,0.9)" }}>
                    You haven't booked your pass for this event yet! Lock in your ticket now to join the crew.
                  </p>
                  <Link
                    to={`/events/${event.id}`}
                    className="ed-pricing__book-btn"
                    style={{ textDecoration: "none", display: "inline-flex", width: "auto", padding: "10px 24px" }}
                  >
                    Book My Pass
                  </Link>
                </div>
              )}
            </div>

            {/* Split Checkout Payment Card */}
            {isMember && squad.booking && !members.find(m => m.user?.id === user.id)?.has_paid && (
              <div className="squad-card squad-payment-split-card">
                <h2 className="squad-card__heading" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span>💳 Pay Your Fractional Share</span>
                </h2>
                <p style={{ fontSize: "0.88rem", color: "hsl(var(--muted))", marginTop: 0 }}>
                  This is a shared crew checkout. Pay your individual share to unlock your digital pass.
                </p>

                <div className="squad-payment-split-summary" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem" }}>
                    <span>Your Share Price:</span>
                    <strong style={{ color: "var(--primary-light)" }}>₹{(parseFloat(squad.booking.total_amount) / squad.booking.quantity).toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "hsl(var(--muted))" }}>
                    <span>Pass Type:</span>
                    <span>{squad.booking.tier_type}</span>
                  </div>
                </div>

                <form onSubmit={handlePayShare} className="ed-checkout-form">
                  <div className="ed-card-fields">
                    <div className="create-event__field">
                      <label style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>Card Number</label>
                      <input 
                        type="text" 
                        placeholder="4111 2222 3333 4444"
                        value={shareCardNumber}
                        onChange={(e) => setShareCardNumber(e.target.value)}
                        maxLength={19}
                        required
                      />
                    </div>
                    <div className="ed-card-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px" }}>
                      <div className="create-event__field">
                        <label style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>Expiry Date</label>
                        <input 
                          type="text" 
                          placeholder="MM/YY"
                          value={shareExpiry}
                          onChange={(e) => setShareExpiry(e.target.value)}
                          maxLength={5}
                          required
                        />
                      </div>
                      <div className="create-event__field">
                        <label style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>CVV</label>
                        <input 
                          type="password" 
                          placeholder="123"
                          value={shareCvv}
                          onChange={(e) => setShareCvv(e.target.value)}
                          maxLength={3}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="ed-pricing__book-btn" style={{ marginTop: "24px", width: "100%" }} disabled={payingShare}>
                    {payingShare ? "Verifying..." : `Pay Share — ₹${(parseFloat(squad.booking.total_amount) / squad.booking.quantity).toFixed(2)}`}
                  </button>
                </form>
              </div>
            )}

            {/* Crew Chat Room */}
            {isMember && (
              <div className="squad-card squad-chat-card">
                <h2 className="squad-card__heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>💬 Crew Chat Room</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 400, color: "hsl(var(--muted))" }}>Auto-refreshing</span>
                </h2>

                <div className="squad-chat__window">
                  {messages.length === 0 ? (
                    <div className="squad-chat__empty">
                      <p>No messages yet. Start coordinating meetups or travel plans!</p>
                    </div>
                  ) : (
                    <div className="squad-chat__list">
                      {messages.map((msg) => {
                        const isSelf = msg.user_id === user?.id;
                        const isLeader = msg.user_id === squad.leader_id;
                        return (
                          <div key={msg.id} className={`squad-chat__item ${isSelf ? "squad-chat__item--self" : ""}`}>
                            <div className="squad-chat__meta">
                              <span className="squad-chat__sender">{msg.user?.full_name || "Friend"}</span>
                              {isLeader && <span className="squad-chat__leader-badge">Host 👑</span>}
                              {msg.is_pinned && <span className="squad-chat__pin-badge">Pinned 📌</span>}
                            </div>
                            
                            <div className="squad-chat__bubble-row">
                              <div className="squad-chat__bubble">
                                {msg.message}
                              </div>
                              
                              {user?.id === squad.leader_id && (
                                <button
                                  type="button"
                                  className={`squad-chat__pin-btn ${msg.is_pinned ? "active" : ""}`}
                                  onClick={() => handleTogglePin(msg.id, msg.is_pinned)}
                                  title={msg.is_pinned ? "Unpin Announcement" : "Pin as announcement"}
                                >
                                  📌
                                </button>
                              )}
                            </div>
                            
                            <span className="squad-chat__time">
                              {new Date(msg.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="squad-chat__input-area">
                  <input
                    type="text"
                    placeholder="Type a message to coordinate plans..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    maxLength={500}
                    required
                  />
                  <button type="submit" disabled={sendingMsg}>
                    Send
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Right Sidebar Details */}
          <div className="squad-sidebar">
            {/* Split Bill Progress Widget */}
            {squad.booking && (
              <div className="squad-card squad-split-progress-widget" style={{ marginBottom: "20px" }}>
                <h3 style={{ fontSize: "0.85rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--primary-light)", margin: "0 0 16px 0" }}>
                  💸 Split Bill Progress
                </h3>
                
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "0.9rem" }}>
                  <span>Paid:</span>
                  <strong>
                    {members.filter(m => m.has_paid).length} of {squad.booking.quantity} Crew
                  </strong>
                </div>

                {/* Progress bar */}
                <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden", marginBottom: "16px" }}>
                  <div 
                    style={{ 
                      width: `${(members.filter(m => m.has_paid).length / squad.booking.quantity) * 100}%`, 
                      height: "100%", 
                      background: "linear-gradient(90deg, var(--primary), var(--primary-light))",
                      boxShadow: "0 0 8px var(--primary)",
                      transition: "width 0.4s ease"
                    }} 
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", borderTop: "1px solid var(--border)", paddingTop: "12px" }}>
                  <span style={{ color: "hsl(var(--muted))" }}>Total Tab:</span>
                  <span style={{ color: "white", fontWeight: 700 }}>₹{parseFloat(squad.booking.total_amount).toLocaleString("en-IN")}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem", marginTop: "6px" }}>
                  <span style={{ color: "hsl(var(--muted))" }}>Status:</span>
                  <span style={{ 
                    color: squad.booking.status === "confirmed" ? "var(--success)" : "#ffd000",
                    fontWeight: 700 
                  }}>
                    {squad.booking.status === "confirmed" ? "✓ Fully Paid" : "⏳ Pending Payments"}
                  </span>
                </div>
              </div>
            )}

            {/* Event mini card */}
            <div className="squad-event-mini-card">
              <img
                src={event.poster_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=500"}
                alt={event.title}
                className="squad-event-mini-card__poster"
              />
              <div className="squad-event-mini-card__details">
                <Link to={`/events/${event.id}`} style={{ textDecoration: "none" }}>
                  <h3 className="squad-event-mini-card__title">{event.title}</h3>
                </Link>
                <span style={{ fontSize: "0.8rem", color: "var(--primary-light)", fontWeight: 700 }}>
                  {venue.name}
                </span>

                <div className="squad-event-mini-card__meta">
                  <div>
                    <HiCalendar />
                    <span>{formatDate(event.date)}</span>
                  </div>
                  <div>
                    <HiClock />
                    <span>{formatTime(event.start_time)}</span>
                  </div>
                  <div>
                    <HiMapPin />
                    <span>{venue.city}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Invite card */}
            <div className="squad-invite-card">
              <h3>Bring the Crew</h3>
              <p>Send the invite link to your group. Anyone with the link can join the squad.</p>
              
              <div className="squad-invite-card__box">
                <span className="squad-invite-card__code">{window.location.href}</span>
                <button
                  type="button"
                  className="squad-invite-card__copy-btn"
                  onClick={handleCopyLink}
                >
                  <HiShare style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                  Copy Link
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SquadDetail;
