import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { HiMapPin, HiCalendar, HiClock, HiUserGroup, HiShare, HiCheck, HiExclamationTriangle } from "react-icons/hi2";
import api from "../lib/api";
import toast from "react-hot-toast";
import "./SquadDetail.css";

function SquadDetail() {
  const { squadId } = useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [squadData, setSquadData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

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
  
  // Verify if current user is member
  const isMember = members.some((m) => m.user?.id === user.id);

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

        {/* Grid Workspace */}
        <div className="squad-grid">
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

                  {member.has_booked ? (
                    <span className="squad-member-row__badge squad-member-row__badge--booked">
                      <HiCheck /> Ticket Booked
                    </span>
                  ) : (
                    <span className="squad-member-row__badge squad-member-row__badge--pending">
                      <HiExclamationTriangle /> Pending RSVP
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Quick RSVP CTA if user is in squad but hasn't booked passes yet */}
            {isMember && !members.find(m => m.user?.id === user.id)?.has_booked && (
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

          {/* Right Sidebar Details */}
          <div className="squad-sidebar">
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
