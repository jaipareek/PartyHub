import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hls from "hls.js";
import {
  HiSparkles,
  HiArrowRight,
  HiTicket,
  HiUsers,
  HiMapPin,
  HiCalendar,
  HiClock,
  HiShieldCheck,
  HiFire,
  HiArrowTopRightOnSquare,
  HiUserPlus,
  HiCheckCircle,
  HiOutlineFaceSmile
} from "react-icons/hi2";
import api from "../lib/api";
import toast from "react-hot-toast";
import EventCard from "../components/ui/EventCard";
import "./Home.css";

gsap.registerPlugin(ScrollTrigger);

const HLS_URL =
  "https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8";

const HERO_ROLES = ["Discover", "Book", "Vibe", "Celebrate"];

const MATCHMAKER_CATEGORIES = [
  { value: "club_night", label: "Club Night 🍾" },
  { value: "live_music", label: "Live Music 🎸" },
  { value: "standup", label: "Comedy 🎙️" },
  { value: "gaming", label: "Gaming Night 🎮" },
  { value: "festival", label: "Festival Vibe 🎡" },
];

const MATCHMAKER_GROUPS = [
  { value: "stag", label: "Stag (Solo) 🙋‍♂️" },
  { value: "couple", label: "Couple 👩‍❤️‍👨" },
  { value: "squad", label: "Full Squad 👥" },
];

// ── HLS Video Background Component ──
function HlsVideo({ className, flip = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls;
    if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: false });
      hls.loadSource(HLS_URL);
      hls.attachMedia(video);
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = HLS_URL;
    }

    return () => {
      if (hls) hls.destroy();
    };
  }, []);

  return (
    <video
      ref={videoRef}
      className={className}
      autoPlay
      muted
      loop
      playsInline
      style={flip ? { transform: "scaleY(-1)" } : undefined}
    />
  );
}

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const [roleIndex, setRoleIndex] = useState(0);

  // Dashboard state variables
  const [myBookings, setMyBookings] = useState([]);
  const [mySquads, setMySquads] = useState([]);
  const [tonightEvents, setTonightEvents] = useState([]);
  const [dealsEvents, setDealsEvents] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(false);

  // Matchmaker Widget state
  const [matchCategory, setMatchCategory] = useState("club_night");
  const [matchGroup, setMatchGroup] = useState("squad");
  const [isMatching, setIsMatching] = useState(false);
  const [matchStep, setMatchStep] = useState(0); // 0 = idle, 1, 2, 3 = loader animations, 4 = resolved
  const [matchedEvent, setMatchedEvent] = useState(null);

  // Refs for GSAP
  const heroRef = useRef(null);
  const marqueeRef = useRef(null);

  // Cycle hero roles
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % HERO_ROLES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // GSAP hero entrance
  useEffect(() => {
    if (!heroRef.current) return;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(
        ".name-reveal",
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 1.2, delay: 0.1 }
      );

      tl.fromTo(
        ".blur-in",
        { opacity: 0, filter: "blur(10px)", y: 20 },
        { opacity: 1, filter: "blur(0px)", y: 0, duration: 1, stagger: 0.1 },
        "-=0.8"
      );
    }, heroRef);

    return () => ctx.revert();
  }, [isAuthenticated]); // Re-run when auth switches to load correct layouts

  // GSAP marquee
  useEffect(() => {
    if (!marqueeRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(".marquee-track", {
        xPercent: -50,
        duration: 40,
        ease: "none",
        repeat: -1,
      });
    }, marqueeRef);
    return () => ctx.revert();
  }, []);

  // Load user data if logged in
  useEffect(() => {
    if (isAuthenticated && profile?.role === "customer") {
      fetchDashboardData();
    }
  }, [isAuthenticated, profile]);

  // Owner dashboard states
  const [ownerVenue, setOwnerVenue] = useState(null);
  const [ownerEventsList, setOwnerEventsList] = useState([]);
  const [ownerReservationsList, setOwnerReservationsList] = useState([]);

  useEffect(() => {
    if (isAuthenticated && profile?.role === "venue_owner") {
      fetchOwnerDashboardData();
    }
  }, [isAuthenticated, profile]);

  // Admin auto redirect
  useEffect(() => {
    if (isAuthenticated && profile?.role === "admin") {
      navigate("/admin/dashboard");
    }
  }, [isAuthenticated, profile, navigate]);

  const fetchOwnerDashboardData = async () => {
    try {
      setDashboardLoading(true);
      const profileRes = await api.get("/owner/profile");
      if (profileRes.data?.success && profileRes.data.data.venue) {
        const venue = profileRes.data.data.venue;
        setOwnerVenue(venue);

        const [eventsRes, reservationsRes] = await Promise.all([
          api.get("/owner/events"),
          api.get(`/table-reservations/venue/${venue.id}`)
        ]);

        if (eventsRes.data?.success) setOwnerEventsList(eventsRes.data.data);
        if (reservationsRes.data?.success) setOwnerReservationsList(reservationsRes.data.data);
      }
    } catch (err) {
      console.error("Error loading owner home dashboard:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setDashboardLoading(true);
      // Fetch bookings, squads, tonight, and deals in parallel
      const [bookingsRes, squadsRes, tonightRes, dealsRes] = await Promise.all([
        api.get("/bookings/my-bookings"),
        api.get("/squads/my/active"),
        api.get("/events/tonight"),
        api.get("/events/student-deals"),
      ]);

      if (bookingsRes.data?.success) setMyBookings(bookingsRes.data.data.slice(0, 2));
      if (squadsRes.data?.success) setMySquads(squadsRes.data.data.slice(0, 3));
      if (tonightRes.data?.success) setTonightEvents(tonightRes.data.data.slice(0, 3));
      if (dealsRes.data?.success) setDealsEvents(dealsRes.data.data.slice(0, 3));

    } catch (err) {
      console.error("Error loading home dashboard data:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  // Vibe generator match click logic
  const handleVibeMatch = async () => {
    setIsMatching(true);
    setMatchStep(1);

    // Trigger mock scanning animations
    setTimeout(() => setMatchStep(2), 1000);
    setTimeout(() => setMatchStep(3), 2000);

    try {
      // Pull trending events and filter by selected category
      const res = await api.get("/events/search", {
        params: { category: matchCategory },
      });

      const items = res.data?.data || [];
      const available = items.filter((e) => e.booked_count < e.total_capacity);

      setTimeout(() => {
        if (available.length > 0) {
          // Select random matching event
          const randomIdx = Math.floor(Math.random() * available.length);
          setMatchedEvent(available[randomIdx]);
        } else {
          // Fallback if none found
          setMatchedEvent(null);
        }
        setMatchStep(4);
      }, 3000);

    } catch (err) {
      console.error("Matchmaker lookup failed:", err);
      setTimeout(() => {
        setMatchedEvent(null);
        setMatchStep(4);
      }, 3000);
    }
  };

  // Launch a new squad instantly for matched event
  const launchSquadForMatched = async (eventId, title) => {
    try {
      const res = await api.post("/squads", {
        name: `${profile?.full_name || "My"}'s Squad — ${title.slice(0, 15)}`,
        event_id: eventId,
      });

      if (res.data?.success) {
        toast.success("Squad launched successfully! 🚀");
        navigate(`/squads/${res.data.data.id}`);
      }
    } catch (err) {
      console.error("Matchmaker squad creation failed:", err);
      toast.error(err.response?.data?.error || "Could not launch squad");
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  // Check if admin, redirect them to admin dashboard directly
  if (isAuthenticated && profile?.role === "admin") {
    return (
      <div className="venue-detail__loading">
        <p style={{ color: "hsl(var(--muted))" }}>Redirecting to Admin Portal...</p>
        <button onClick={() => navigate("/admin/dashboard")} className="ed-success-btn" style={{ marginTop: "20px" }}>
          Go to Admin Portal
        </button>
      </div>
    );
  }

  return (
    <div className="afterdark-home">
      {!isAuthenticated ? (
        <section className="hero" ref={heroRef}>
          <div className="hero__video-wrap">
            <HlsVideo className="hero__video" />
            <div className="hero__overlay" />
            <div className="hero__fade" />
          </div>

          <div className="hero__content">
            <span className="hero__eyebrow blur-in">Your Night, Simplified</span>
            <h1 className="hero__title name-reveal">
              After<em>Dark</em>
            </h1>
            <p className="hero__role blur-in">
              A place to{" "}
              <span key={roleIndex} className="hero__role-word animate-role-fade-in">
                {HERO_ROLES[roleIndex]}
              </span>{" "}
              in your city.
            </p>
            <p className="hero__description blur-in">
              Discover nearby events, book tickets instantly, reserve tables, and
              plan nights out with your squad — all in one place.
            </p>

            <div className="hero__cta blur-in">
              <button className="hero__btn hero__btn--solid" onClick={() => navigate("/signup")}>
                <HiSparkles /> Get Started
              </button>
              <button className="hero__btn hero__btn--outline" onClick={() => navigate("/owner/login")}>
                I'm a Venue Owner
              </button>
            </div>
          </div>

          <div className="hero__scroll-indicator blur-in">
            <span>Scroll</span>
            <div className="hero__scroll-line">
              <div className="hero__scroll-dot animate-scroll-down" />
            </div>
          </div>
        </section>
      ) : profile?.role === "venue_owner" ? (
        
        // 2. PERSONALIZED LOGGED-IN PARTNER HUB
        <div className="home-dashboard">
          
          {/* Greeting Header */}
          <div className="home-greeting">
            <div className="greeting-text">
              <span className="greeting-eyebrow">PARTNER PORTAL HUB 🦉</span>
              <h1 className="greeting-title">Welcome back, <em>{profile?.full_name || "Partner"}!</em></h1>
            </div>
            
            <div className="greeting-meta-badges">
              {ownerVenue?.is_verified ? (
                <div className="greeting-badge" style={{ background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)", color: "#10b981" }}>
                  <span>✓ Verified Venue Partner</span>
                </div>
              ) : (
                <div className="greeting-badge" style={{ background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.2)", color: "#f59e0b" }}>
                  <span>⏳ Verification Pending</span>
                </div>
              )}
            </div>
          </div>

          {/* Main content split */}
          <div className="home-split-row">
            
            {/* Left Column: Venue Spotlight Card */}
            <div className="home-col-left">
              <div className="glass-card" style={{ padding: 0, overflow: "hidden" }}>
                <div className="vd-cover-frame" style={{ height: "180px", aspectRatio: "auto", borderRadius: 0 }}>
                  <img 
                    src={ownerVenue?.images?.[0] || "https://images.unsplash.com/photo-1566417713940-fe7c8460ffd3?w=500"} 
                    alt={ownerVenue?.name || "My Venue"} 
                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  />
                </div>
                
                <div style={{ padding: "24px", textAlign: "left" }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1.4rem", color: "white", fontWeight: 800 }}>
                    {ownerVenue?.name || "No Registered Venue"}
                  </h3>
                  <p style={{ margin: "0 0 16px 0", color: "hsl(var(--muted))", fontSize: "0.85rem" }}>
                    📍 {ownerVenue?.address || "Address not configured"}, {ownerVenue?.city || ""}
                  </p>

                  <div style={{ display: "flex", gap: "10px" }}>
                    <Link to={ownerVenue ? `/venues/${ownerVenue.id}` : "/venues"} className="vd-btn-outline" style={{ flex: 1, textAlign: "center", textDecoration: "none", fontSize: "0.8rem", padding: "8px 12px" }}>
                      View Public Page
                    </Link>
                    <Link to="/owner/dashboard?tab=venue" className="vd-btn-primary" style={{ flex: 1, textAlign: "center", textDecoration: "none", fontSize: "0.8rem", padding: "8px 12px" }}>
                      Manage Profile
                    </Link>
                  </div>
                </div>
              </div>

              {/* Operations Stats Overview */}
              <div className="glass-card" style={{ marginTop: "24px" }}>
                <h3 className="glass-card__title">
                  <HiSparkles style={{ color: "#f59e0b", fontSize: "1.2rem" }} /> Operational Overview
                </h3>
                
                <div className="vd-scorecards-grid" style={{ gridTemplateColumns: "repeat(2, 1fr)", gap: "16px", marginTop: "16px" }}>
                  <div className="vd-metric-card" style={{ padding: "16px" }}>
                    <span className="vd-metric-lbl">📅 Published Events</span>
                    <span className="vd-metric-val" style={{ fontSize: "1.8rem", color: "white" }}>{ownerEventsList.length}</span>
                  </div>
                  
                  <div className="vd-metric-card" style={{ padding: "16px", borderColor: ownerReservationsList.filter(r => r.status === 'pending').length > 0 ? "rgba(245, 158, 11, 0.4)" : "var(--border)" }}>
                    <span className="vd-metric-lbl">🍽️ Pending Tables</span>
                    <span className="vd-metric-val" style={{ fontSize: "1.8rem", color: ownerReservationsList.filter(r => r.status === 'pending').length > 0 ? "#f59e0b" : "white" }}>
                      {ownerReservationsList.filter(r => r.status === 'pending').length}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Quick Shortcuts */}
            <div className="home-col-right">
              <div className="glass-card" style={{ height: "100%" }}>
                <h3 className="glass-card__title">
                  ⚡ Quick Operations Center
                </h3>
                <p style={{ color: "hsl(var(--muted))", fontSize: "0.85rem", marginBottom: "20px", textAlign: "left" }}>
                  Select a task to jump directly into your partner control panel operations.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <Link to="/owner/dashboard?tab=create-event" className="pass-mini-card" style={{ textDecoration: "none", cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", padding: "16px", border: "1px solid var(--border)", borderRadius: "16px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ background: "rgba(124, 92, 252, 0.1)", color: "#a78bfa", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                        📅
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <h4 style={{ margin: "0 0 2px 0", color: "white", fontSize: "0.95rem" }}>Publish New Event</h4>
                        <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted))" }}>Configure pass pricing levels and set capacities</span>
                      </div>
                    </div>
                  </Link>

                  <Link to="/owner/dashboard?tab=events" className="pass-mini-card" style={{ textDecoration: "none", cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", padding: "16px", border: "1px solid var(--border)", borderRadius: "16px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                        👥
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <h4 style={{ margin: "0 0 2px 0", color: "white", fontSize: "0.95rem" }}>Manage Guestlists</h4>
                        <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted))" }}>Check who has booked passes and review tickets</span>
                      </div>
                    </div>
                  </Link>

                  <Link to="/owner/dashboard?tab=tables" className="pass-mini-card" style={{ textDecoration: "none", cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", padding: "16px", border: "1px solid var(--border)", borderRadius: "16px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                        🍽️
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <h4 style={{ margin: "0 0 2px 0", color: "white", fontSize: "0.95rem" }}>Table Reservations</h4>
                        <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted))" }}>Approve or decline guest table seat requests</span>
                      </div>
                    </div>
                  </Link>

                  <Link to="/owner/dashboard?tab=venue" className="pass-mini-card" style={{ textDecoration: "none", cursor: "pointer", background: "rgba(255, 255, 255, 0.02)", padding: "16px", border: "1px solid var(--border)", borderRadius: "16px" }}>
                    <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                      <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
                        🏠
                      </div>
                      <div style={{ textAlign: "left" }}>
                        <h4 style={{ margin: "0 0 2px 0", color: "white", fontSize: "0.95rem" }}>Edit Profile & Info</h4>
                        <span style={{ fontSize: "0.78rem", color: "hsl(var(--muted))" }}>Modify timings, pictures, social pages, and contacts</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>
      ) : (
        
        // 3. PERSONALIZED LOGGED-IN CUSTOMER VIBE HUB
        <div className="home-dashboard">
          
          {/* Greeting Header */}
          <div className="home-greeting">
            <div className="greeting-text">
              <span className="greeting-eyebrow">WELCOME BACK, {profile?.full_name?.toUpperCase() || "OWL"} 🦉</span>
              <h1 className="greeting-title">Ready for <em>tonight?</em></h1>
            </div>
            
            <div className="greeting-meta-badges">
              {profile?.is_student ? (
                <div className="greeting-badge student">
                  <span>🎓 Student Partner (Discount Eligible)</span>
                </div>
              ) : (
                <Link to="/profile" className="greeting-badge verify-prompt">
                  <span>Verify Student ID for discounts 🎓</span>
                </Link>
              )}
            </div>
          </div>

          {/* Quick Actions split layout */}
          <div className="home-split-row">
            
            {/* Left Block: Fast Passes and Squads */}
            <div className="home-col-left">
              
              {/* Active Passes list */}
              <div className="glass-card">
                <h3 className="glass-card__title">
                  <HiTicket style={{ color: "#7d5cfc", fontSize: "1.2rem" }} /> My Tickets
                </h3>
                
                {myBookings.length === 0 ? (
                  <div className="empty-panel">
                    <p>No active passes. Secure tickets to start your weekend!</p>
                    <Link to="/events" className="empty-panel__btn">Browse Events</Link>
                  </div>
                ) : (
                  <div className="passes-mini-list">
                    {myBookings.map((booking) => {
                      const event = booking.event || {};
                      return (
                        <div key={booking.id} className="pass-mini-card">
                          <img src={event.poster_url} alt={event.title} />
                          <div className="pass-mini-card__info">
                            <h4>{event.title}</h4>
                            <span>📅 {formatDate(event.date)} • {event.venue?.name || "Venue"}</span>
                          </div>
                          <Link to="/my-bookings" className="pass-mini-card__btn">
                            View QR Code
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Joined Crews list */}
              <div className="glass-card" style={{ marginTop: "24px" }}>
                <h3 className="glass-card__title">
                  <HiUsers style={{ color: "#a78bfa", fontSize: "1.2rem" }} /> Active Crews
                </h3>
                
                {mySquads.length === 0 ? (
                  <div className="empty-panel">
                    <p>No active squads. Invite friends and coordinate bookings!</p>
                    <Link to="/events" className="empty-panel__btn">Find a party</Link>
                  </div>
                ) : (
                  <div className="squads-mini-list">
                    {mySquads.map((squad) => (
                      <div key={squad.id} className="squad-mini-card">
                        <div>
                          <h4>{squad.name}</h4>
                          <span>🎉 Event: {squad.event?.title?.slice(0, 22)}...</span>
                        </div>
                        <Link to={`/squads/${squad.id}`} className="squad-mini-card__btn">
                          Open Chat
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Block: Interactive Squad Vibe Matchmaker */}
            <div className="home-col-right">
              <div className="glass-card matchmaker-card">
                <div className="matchmaker-header">
                  <h3 className="glass-card__title" style={{ margin: 0 }}>
                    <HiSparkles style={{ color: "#f59e0b", fontSize: "1.25rem" }} /> Squad Vibe Matchmaker
                  </h3>
                  <span className="matchmaker-badge">FUN</span>
                </div>
                
                <p className="matchmaker-intro">
                  Stuck on where to go? Select your vibe and group size to instantly find the perfect event match and generate a squad draft!
                </p>

                {/* Match Generator Controls */}
                {!isMatching && (
                  <div className="matchmaker-form">
                    <div className="matchmaker-field">
                      <label>Vibe Category</label>
                      <select value={matchCategory} onChange={(e) => setMatchCategory(e.target.value)}>
                        {MATCHMAKER_CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="matchmaker-field">
                      <label>Group Size</label>
                      <select value={matchGroup} onChange={(e) => setMatchGroup(e.target.value)}>
                        {MATCHMAKER_GROUPS.map((g) => (
                          <option key={g.value} value={g.value}>{g.label}</option>
                        ))}
                      </select>
                    </div>

                    <button className="matchmaker-submit-btn" onClick={handleVibeMatch}>
                      Generate Vibe Match ⚡
                    </button>
                  </div>
                )}

                {/* Match Loading Stages */}
                {isMatching && matchStep < 4 && (
                  <div className="matchmaker-loading">
                    <div className="matchmaker-spinner" />
                    <AnimatePresence mode="wait">
                      {matchStep === 1 && (
                        <motion.span 
                          key="step1" 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="matchmaker-loading__text"
                        >
                          🔍 Scanning verified venues nearby...
                        </motion.span>
                      )}
                      {matchStep === 2 && (
                        <motion.span 
                          key="step2" 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="matchmaker-loading__text"
                        >
                          📊 Analyzing crowd occupancy levels...
                        </motion.span>
                      )}
                      {matchStep === 3 && (
                        <motion.span 
                          key="step3" 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="matchmaker-loading__text"
                        >
                          🍻 Matching ticket pricing discount deals...
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Match Resolved Presentation */}
                {isMatching && matchStep === 4 && (
                  <motion.div 
                    className="matchmaker-resolved"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    {matchedEvent ? (
                      <div className="matched-event-card">
                        <div className="matched-success-header">
                          <HiCheckCircle style={{ color: "#10b981", fontSize: "1.4rem" }} />
                          <span>Perfect Match Found!</span>
                        </div>
                        
                        <div className="matched-event-content">
                          <img src={matchedEvent.poster_url} alt={matchedEvent.title} />
                          <div className="matched-event-details">
                            <h4>{matchedEvent.title}</h4>
                            <p>📍 {matchedEvent.venues?.name || "Premium Venue"}</p>
                            <span className="matched-price">Tickets from ₹{matchedEvent.pricing?.[0]?.price || 0}</span>
                          </div>
                        </div>

                        <div className="matched-actions">
                          <Link to={`/events/${matchedEvent.id}`} className="matched-btn book">
                            Book Tickets
                          </Link>
                          <button 
                            className="matched-btn squad"
                            onClick={() => launchSquadForMatched(matchedEvent.id, matchedEvent.title)}
                          >
                            Launch Squad
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="matched-empty">
                        <HiOutlineFaceSmile style={{ fontSize: "2.2rem", color: "hsl(var(--muted))" }} />
                        <h4>All Sold Out!</h4>
                        <p>No active open spots matched that category tonight. Try exploring other vibes!</p>
                      </div>
                    )}

                    <button 
                      className="matchmaker-reset-btn" 
                      onClick={() => {
                        setIsMatching(false);
                        setMatchedEvent(null);
                      }}
                    >
                      Reset Generator
                    </button>
                  </motion.div>
                )}

              </div>
            </div>

          </div>

          {/* Tonight's Event spotlight recommendations */}
          {tonightEvents.length > 0 && (
            <div className="home-spotlight-section">
              <h2 className="home-spotlight-title">
                <HiFire style={{ color: "#ef4444", marginRight: "8px", verticalAlign: "middle" }} />
                Spotlight Tonight
              </h2>
              <div className="home-spotlight-grid">
                {tonightEvents.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}

          {/* Student Deals listing */}
          {dealsEvents.length > 0 && (
            <div className="home-spotlight-section" style={{ marginTop: "40px", marginBottom: "40px" }}>
              <h2 className="home-spotlight-title">
                <HiSparkles style={{ color: "#10b981", marginRight: "8px", verticalAlign: "middle" }} />
                Student Offers
              </h2>
              <div className="home-spotlight-grid">
                {dealsEvents.map((e) => (
                  <EventCard key={e.id} event={e} />
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* 3. CORE STATISTICS SECTION */}
      {!isAuthenticated && (
        <section className="stats-section">
          <div className="stats-section__inner">
            {[
              { value: "500+", label: "Events Listed" },
              { value: "200+", label: "Premium Venues" },
              { value: "50K+", label: "Night Owls" },
            ].map((stat, i) => (
              <motion.div
                key={i}
                className="stat-card"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.15 }}
              >
                <span className="stat-card__value">{stat.value}</span>
                <span className="stat-card__label">{stat.label}</span>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* 4. FOOTER SECTIONS */}
      <footer className="site-footer" ref={marqueeRef}>
        <div className="footer__video-wrap">
          <HlsVideo className="hero__video" flip />
          <div className="footer__overlay" />
        </div>

        <div className="footer__marquee">
          <div className="marquee-track">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="marquee-word">
                YOUR NIGHT STARTS HERE •{" "}
              </span>
            ))}
          </div>
        </div>

        <div className="footer__cta">
          <motion.button
            className="footer__cta-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate("/events")}
          >
            <span className="footer__cta-gradient" />
            <span className="footer__cta-inner">
              <HiSparkles /> Explore Events
            </span>
          </motion.button>
        </div>

        <div className="footer__bar">
          <div className="footer__social">
            {["Instagram", "Twitter", "Discord"].map((name) => (
              <a key={name} href="#" className="footer__social-link">
                {name}
              </a>
            ))}
          </div>
          <div className="footer__status">
            <span className="footer__status-dot" />
            <span>Available for bookings</span>
          </div>
          <div className="footer__copyright">
            © 2026 AfterDark. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
