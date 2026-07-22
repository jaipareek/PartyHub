import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { HiXMark, HiChatBubbleLeftRight, HiSparkles, HiArchiveBox } from "react-icons/hi2";
import api from "../../lib/api";
import "./SquadChatDrawer.css";

function SquadChatDrawer({ isOpen, onClose }) {
  const [squads, setSquads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active"); // 'active' | 'archived'
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchSquads();
    }
  }, [isOpen, tab]);

  // Handle ESC key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const fetchSquads = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/squads/my/active?include_archived=true`);
      if (res.data?.success) {
        setSquads(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load squad chats drawer:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (e, squadId) => {
    e.preventDefault();
    e.stopPropagation();
    onClose();
    navigate(`/squads/${squadId}`);
  };

  if (!isOpen) return null;

  const activeSquads = squads.filter((s) => !s.is_archived);
  const archivedSquads = squads.filter((s) => s.is_archived);
  const displaySquads = tab === "active" ? activeSquads : archivedSquads;

  return createPortal(
    <div className="squad-drawer-overlay" onClick={onClose}>
      <div className="squad-drawer-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="squad-drawer-header">
          <div className="squad-drawer-title-group">
            <HiChatBubbleLeftRight className="squad-drawer-icon" />
            <div>
              <h3>My Party Squad Chats</h3>
              <span className="squad-drawer-subtitle">
                {tab === "active" ? `${activeSquads.length} Active Chats` : `${archivedSquads.length} Archived Chats (>48h Inactive)`}
              </span>
            </div>
          </div>
          <button
            type="button"
            className="squad-drawer-close"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Close Drawer"
          >
            <HiXMark />
          </button>
        </div>

        {/* Tab Filters */}
        <div className="squad-drawer-tabs">
          <button
            type="button"
            className={`squad-drawer-tab ${tab === "active" ? "active" : ""}`}
            onClick={() => setTab("active")}
          >
            <HiSparkles /> Active ({activeSquads.length})
          </button>
          <button
            type="button"
            className={`squad-drawer-tab ${tab === "archived" ? "active" : ""}`}
            onClick={() => setTab("archived")}
          >
            <HiArchiveBox /> Archived &gt;48h ({archivedSquads.length})
          </button>
        </div>

        {/* Auto Clean Notice */}
        <div className="squad-drawer-notice">
          <span>🧹 Chats inactive or older than 48h auto-move to Archived so your inbox stays clean.</span>
        </div>

        {/* List of Squad Threads */}
        <div className="squad-drawer-list">
          {loading ? (
            <div className="squad-drawer-loading">
              <div className="squad-drawer-spinner" />
            </div>
          ) : displaySquads.length === 0 ? (
            <div className="squad-drawer-empty">
              <p>
                {tab === "active"
                  ? "No active squad chats right now. Join or launch a squad to start chatting!"
                  : "No archived chats found."}
              </p>
              {tab === "active" && (
                <button
                  type="button"
                  className="squad-drawer-browse-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose();
                    navigate("/events");
                  }}
                >
                  Browse Events
                </button>
              )}
            </div>
          ) : (
            displaySquads.map((squad) => (
              <div
                key={squad.id}
                role="button"
                tabIndex={0}
                className={`squad-drawer-card ${squad.is_archived ? "archived" : ""}`}
                onClick={(e) => handleCardClick(e, squad.id)}
              >
                <div className="squad-drawer-card-poster">
                  <img
                    src={squad.event?.poster_url || "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150"}
                    alt={squad.name}
                  />
                </div>

                <div className="squad-drawer-card-info">
                  <div className="squad-drawer-card-top">
                    <h4>{squad.name}</h4>
                    <span className="squad-drawer-card-event">
                      {squad.event?.title ? squad.event.title.slice(0, 18) + "..." : "Party"}
                    </span>
                  </div>

                  <p className="squad-drawer-card-preview">
                    {squad.last_message ? (
                      <>
                        <strong>{squad.last_message.user?.full_name?.split(" ")[0]}:</strong>{" "}
                        {squad.last_message.message}
                      </>
                    ) : (
                      "✨ No messages yet. Say hi!"
                    )}
                  </p>

                  <div className="squad-drawer-card-meta">
                    <span>
                      📅 {squad.event?.date ? new Date(squad.event.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }) : "Event"}
                    </span>
                    <span className="squad-drawer-card-status">
                      {squad.is_archived ? "Archived (48h+)" : "Active"}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

export default SquadChatDrawer;
