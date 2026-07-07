import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { HiArrowRightOnRectangle } from "react-icons/hi2";
import toast from "react-hot-toast";
import "./Navbar.css";

const NAV_LINKS = [
  { label: "Home", path: "/" },
  { label: "Events", path: "/events" },
  { label: "Venues", path: "/venues" },
];

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated, signOut, profile } = useAuth();

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
          {NAV_LINKS.map((link) => (
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
            {profile?.role === "venue_owner" || profile?.role === "admin" ? (
              <Link to="/owner/dashboard" style={{ textDecoration: "none" }}>
                <span className="pill-navbar__avatar" title="Go to Dashboard">
                  {getInitials()}
                </span>
              </Link>
            ) : (
              <span className="pill-navbar__avatar" title={user?.email}>
                {getInitials()}
              </span>
            )}
            <button
              className="pill-navbar__signout"
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
      </div>
    </nav>
  );
}

export default Navbar;
