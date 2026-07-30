import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HiArrowRightOnRectangle, HiBell, HiTrash, HiChatBubbleLeftRight, HiBars3, HiXMark } from "react-icons/hi2";
import SquadChatDrawer from "../ui/SquadChatDrawer";
import api from "../../lib/api";
import toast from "react-hot-toast";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Events", path: "/events" },
  { label: "Venues", path: "/venues" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, profile } = useAuth();

  // Notification & Squad Chat states
  const [notifications, setNotifications] = useState([]);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showSquadChatDrawer, setShowSquadChatDrawer] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      return;
    }
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const fetchNotifications = async () => {
    if (!isAuthenticated || !user) {
      setNotifications([]);
      return;
    }
    try {
      const res = await api.get("/notifications");
      if (res.data?.success) {
        setNotifications(res.data.data);
      }
    } catch (err) {
      if (err.response?.status === 401) {
        setNotifications([]);
      } else {
        console.error("Failed to load notifications:", err);
      }
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const res = await api.put("/notifications/mark-read");
      if (res.data?.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      }
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleDeleteNotification = async (e, id) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/notifications/${id}`);
      if (res.data?.success) {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out 👋");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  // Get initials from user name or email
  const getInitials = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "?";
  };

  const activeLinks = isAuthenticated
    ? [
        { label: "Home", path: "/" },
        { label: "Events", path: "/events" },
        { label: "Venues", path: "/venues" },
        ...(profile?.role === "customer" ? [{ label: "My Tickets", path: "/my-bookings" }] : []),
      ]
    : [{ label: "Home", path: "/" }];

  return (
    <nav className="pill-navbar">
      <div className={`pill-navbar__inner ${scrolled ? "scrolled" : ""}`}>
        {/* Logo */}
        <Link to="/" className="pill-navbar__logo">
          <span className="pill-navbar__logo-ring">
            <span className="pill-navbar__logo-text">AD</span>
          </span>
        </Link>

        {/* Divider */}
        <span className="pill-navbar__divider hide-mobile" />

        {/* Navigation Links */}
        <div className="pill-navbar__links hide-mobile">
          {activeLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`pill-navbar__link ${
                location.pathname === link.path ? "active" : ""
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Auth Section */}
        {isAuthenticated ? (
          <div className="pill-navbar__user">
            {/* Squad Chat Inbox Trigger */}
            <div className="pill-navbar__notif-wrapper hide-mobile">
              <button
                type="button"
                className="pill-navbar__notif-btn"
                onClick={() => setShowSquadChatDrawer(!showSquadChatDrawer)}
                title="Party Squad Chats"
              >
                <HiChatBubbleLeftRight style={{ fontSize: "1.3rem", color: showSquadChatDrawer ? "var(--primary-light)" : "white" }} />
              </button>
            </div>

            {/* Bell Icon & Notification Trigger */}
            <div className="pill-navbar__notif-wrapper hide-mobile">
              <button
                type="button"
                className={`pill-navbar__notif-btn${notifications.some(n => !n.is_read) ? " pill-navbar__notif-btn--has-unread" : ""}`}
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                title="Notifications"
              >
                <HiBell className="pill-navbar__notif-icon" style={{ fontSize: "1.3rem", color: showNotifDrawer ? "var(--primary-light)" : "white" }} />
                {notifications.some(n => !n.is_read) && (
                  <span className="pill-navbar__notif-badge">
                    {notifications.filter(n => !n.is_read).length}
                  </span>
                )}
              </button>
            </div>

            {profile?.role === "admin" ? (
              <Link to="/admin/dashboard" style={{ textDecoration: "none" }}>
                <span className="pill-navbar__avatar" title="Go to Admin Dashboard">
                  {getInitials()}
                </span>
              </Link>
            ) : profile?.role === "venue_owner" ? (
              <Link to="/owner/dashboard" style={{ textDecoration: "none" }}>
                <span className="pill-navbar__avatar" title="Go to Partner Dashboard">
                  {getInitials()}
                </span>
              </Link>
            ) : (
              <Link to="/profile" style={{ textDecoration: "none" }}>
                <span className="pill-navbar__avatar" title="View Profile">
                  {getInitials()}
                </span>
              </Link>
            )}
            <button
              className="pill-navbar__signout hide-mobile"
              onClick={handleSignOut}
              aria-label="Sign out"
              title="Sign out"
            >
              <HiArrowRightOnRectangle />
            </button>
          </div>
        ) : (
          <Link to="/login" className="pill-navbar__cta">
            <span className="pill-navbar__cta-gradient" />
            <span className="pill-navbar__cta-inner">
              Sign In <span className="pill-navbar__arrow">↗</span>
            </span>
          </Link>
        )}

        {/* 📱 Mobile Hamburger Menu Trigger */}
        <button
          type="button"
          className="pill-navbar__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Navigation Menu"
        >
          {mobileMenuOpen ? <HiXMark /> : <HiBars3 />}
        </button>
      </div>

      {/* 📱 Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="pill-navbar__mobile-drawer">
          <div className="pill-navbar__mobile-links">
            {activeLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`pill-navbar__mobile-link ${
                  location.pathname === link.path ? "active" : ""
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {isAuthenticated && (
              <>
                <button
                  type="button"
                  className="pill-navbar__mobile-link"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowSquadChatDrawer(true);
                  }}
                >
                  💬 Squad Chats Hub
                </button>

                <button
                  type="button"
                  className="pill-navbar__mobile-link"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setShowNotifDrawer(true);
                  }}
                >
                  🔔 Notifications {notifications.some(n => !n.is_read) && `(${notifications.filter(n => !n.is_read).length})`}
                </button>

                <Link
                  to={profile?.role === "admin" ? "/admin/dashboard" : profile?.role === "venue_owner" ? "/owner/dashboard" : "/profile"}
                  className="pill-navbar__mobile-link"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  👤 My Profile & Account
                </Link>

                <button
                  type="button"
                  className="pill-navbar__mobile-link"
                  style={{ color: "#ef4444" }}
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleSignOut();
                  }}
                >
                  🚪 Sign Out
                </button>
              </>
            )}

            {!isAuthenticated && (
              <Link
                to="/login"
                className="pill-navbar__mobile-link pill-navbar__mobile-link--cta"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In / Join AfterDark ↗
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Notifications Drawer */}
      {showNotifDrawer && isAuthenticated && (
        <div className="pill-navbar__notif-drawer">
          <div className="pill-navbar__notif-header">
            <span>Notifications</span>
            {notifications.some(n => !n.is_read) && (
              <button type="button" onClick={handleMarkAllRead}>
                Mark all read
              </button>
            )}
          </div>
          <div className="pill-navbar__notif-list">
            {notifications.length === 0 ? (
              <p className="pill-navbar__notif-empty">No notifications yet</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`pill-navbar__notif-item ${notif.is_read ? "" : "unread"}`}>
                  <div className="pill-navbar__notif-content">
                    <span className="pill-navbar__notif-title">{notif.title}</span>
                    <p className="pill-navbar__notif-msg">{notif.message}</p>
                    <span className="pill-navbar__notif-time">
                      {new Date(notif.created_at).toLocaleDateString("en-IN")} · {new Date(notif.created_at).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="pill-navbar__notif-clear-btn"
                    onClick={(e) => handleDeleteNotification(e, notif.id)}
                    title="Clear notification"
                  >
                    <HiTrash />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 💬 Squad Chat Slide-Out Drawer */}
      <SquadChatDrawer 
        isOpen={showSquadChatDrawer} 
        onClose={() => setShowSquadChatDrawer(false)} 
      />
    </nav>
  );
}

export default Navbar;
