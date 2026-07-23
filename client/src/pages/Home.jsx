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

// ── Moving Animated Party Video Background Component ──
function VideoBackground({ className = "hero__video", flip = false }) {
  return (
    <video
      className={className}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      poster="https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600"
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        ...(flip ? { transform: "scaleY(-1)" } : {})
      }}
    >
      <source src="/videos/hero-bg.mp4" type="video/mp4" />
      <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260319_055001_8e16d972-3b2b-441c-86ad-2901a54682f9.mp4" type="video/mp4" />
    </video>
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
  const [publicEvents, setPublicEvents] = useState([]);

  // Matchmaker Widget state
  const [matchCategory, setMatchCategory] = useState("club_night");
  const [matchGroup, setMatchGroup] = useState("squad");
  const [isMatching, setIsMatching] = useState(false);
  const [matchStep, setMatchStep] = useState(0); // 0 = idle, 1, 2, 3 = loader animations, 4 = resolved
  const [matchedEvent, setMatchedEvent] = useState(null);

  // Refs for GSAP
  const heroRef = useRef(null);
  const marqueeRef = useRef(null);

  // Vibe Check modal & submission tracking states
  const [vibeModalOpen, setVibeModalOpen] = useState(false);
  const [selectedVibeVenue, setSelectedVibeVenue] = useState(null);
  const [vibeType, setVibeType] = useState("techno");
  const [vibeCrowd, setVibeCrowd] = useState("busy");
  const [vibeEnergy, setVibeEnergy] = useState("high");
  const [submittingVibe, setSubmittingVibe] = useState(false);

  const [submittedVibeVenueIds, setSubmittedVibeVenueIds] = useState([]);
  const [submittedVibeBookings, setSubmittedVibeBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("submittedVibeBookings") || "[]");
    } catch {
      return [];
    }
  });

  // Calculate active check-in booking for atmosphere vibe banner
  // MUST satisfy: 
  // 1. Booking status is 'checked_in' (Scanned at gate by bouncer)
  // 2. User has NOT already submitted a vibe check for this venue/booking in the database
  // 3. Party is NOT over (event date is today or ongoing)
  const todayStr = new Date().toISOString().split("T")[0];
  const activeCheckInBooking = myBookings.find((b) => {
    if (b.status !== "checked_in") return false;
    
    // Check if venue already has a submitted vibe report from user in DB
    const vId = b.event?.venue?.id || b.event?.venue_id;
    if (vId && submittedVibeVenueIds.includes(vId)) return false; // Hide if submitted to DB!
    if (submittedVibeBookings.includes(b.id)) return false; // Hide if submitted locally!
    
    // Check if event date has passed
    if (b.event?.date) {
      const eventDateStr = new Date(b.event.date).toISOString().split("T")[0];
      if (eventDateStr < todayStr) return false; // Party is over! Automatically remove!
    }
    
    return true;
  });

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

  // Load user data if logged in or fetch public teaser events
  useEffect(() => {
    if (isAuthenticated && profile?.role === "customer") {
      fetchDashboardData();
    } else if (!isAuthenticated) {
      fetchPublicEvents();
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
      // Fetch bookings, squads, tonight, deals, and submitted vibe records in parallel
      const [bookingsRes, squadsRes, tonightRes, dealsRes, vibesRes] = await Promise.all([
        api.get("/bookings/my-bookings"),
        api.get("/squads/my/active"),
        api.get("/events/tonight"),
        api.get("/events/student-deals"),
        api.get("/venues/my-submitted-vibes").catch(() => null),
      ]);

      if (bookingsRes.data?.success) setMyBookings(bookingsRes.data.data);
      if (squadsRes.data?.success) setMySquads(squadsRes.data.data.slice(0, 3));
      if (tonightRes.data?.success) setTonightEvents(tonightRes.data.data.slice(0, 3));
      if (dealsRes.data?.success) setDealsEvents(dealsRes.data.data.slice(0, 3));
      if (vibesRes?.data?.success) setSubmittedVibeVenueIds(vibesRes.data.data);

    } catch (err) {
      console.error("Error loading home dashboard data:", err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const fetchPublicEvents = async () => {
    try {
      const res = await api.get("/events");
      if (res.data?.success) {
        setPublicEvents(res.data.data.slice(0, 3));
      }
    } catch (err) {
      console.error("Failed to load public events teaser:", err);
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

  const handleVibeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedVibeVenue) return;

    try {
      setSubmittingVibe(true);
      const res = await api.post(`/venues/${selectedVibeVenue.id}/vibe-check`, {
        vibe_type: vibeType,
        crowd_status: vibeCrowd,
        energy_level: vibeEnergy
      });

      if (res.data?.success) {
        toast.success("Live vibe check recorded! ⚡ Check the venue's AfterMeter to see updates.");
        setVibeModalOpen(false);

        // Hide banner immediately for this check-in!
        if (selectedVibeVenue?.id) {
          setSubmittedVibeVenueIds((prev) => [...prev, selectedVibeVenue.id]);
        }
        if (activeCheckInBooking?.id) {
          const updated = [...submittedVibeBookings, activeCheckInBooking.id];
          setSubmittedVibeBookings(updated);
          localStorage.setItem("submittedVibeBookings", JSON.stringify(updated));
        }

        // Refresh dashboard data
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Vibe check submit error:", err);
      toast.error(err.response?.data?.error || "Failed to submit vibe check");
    } finally {
      setSubmittingVibe(false);
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
        <>
          <section className="hero" ref={heroRef}>
            <div className="hero__video-wrap">
              <VideoBackground className="hero__video" />
              <div className="hero__overlay" />
              <div className="hero__fade" />
            </div>

            <div className="hero__ambient-glow" aria-hidden="true">
              <div className="hero__glow-orb hero__glow-orb--1" />
              <div className="hero__glow-orb hero__glow-orb--2" />
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

          {/* NIGHTLIFE EXPERIENCE SHOWCASE SECTION */}
          <section className="nightlife-showcase-section">
            <div className="nightlife-showcase__inner">
              <span className="showcase-eyebrow">⚡ REDEFINING NIGHTLIFE</span>
              <h2 className="showcase-title font-display">
                Everything You Need for an <em>Unforgettable Night</em>
              </h2>
              <p className="showcase-subtitle">
                From instant QR passes to VIP floor table reservations and crew bill splits — AfterDark powers your night.
              </p>

              {/* 3 Holographic Feature Cards */}
              <div className="showcase-cards-grid">
                <div className="party-feature-card party-feature-card--pink">
                  <div className="party-feature-icon">🎟️</div>
                  <h3>Instant Passes & QR Entry</h3>
                  <p>Book event tickets in seconds. Get glowing digital QR passes straight to your mobile wallet for zero-wait door check-in.</p>
                  <span className="party-feature-badge">⚡ Instant Pass</span>
                </div>

                <div className="party-feature-card party-feature-card--cyan">
                  <div className="party-feature-icon">🍾</div>
                  <h3>VIP Table Floor Maps</h3>
                  <p>Explore real-time interactive floor plan maps of top clubs. Pick your exact sofa, review minimum spends, and lock VIP bottle service.</p>
                  <span className="party-feature-badge party-feature-badge--cyan">🥂 Floor Seat Map</span>
                </div>

                <div className="party-feature-card party-feature-card--violet">
                  <div className="party-feature-icon">👥</div>
                  <h3>Crew Squad Bill Splitting</h3>
                  <p>No more chasing money via transfers. Create a party squad, split ticket and table tabs fractionally, and track member payments live.</p>
                  <span className="party-feature-badge party-feature-badge--violet">👥 Bill Splitter</span>
                </div>
              </div>

              {/* Live Vibe Radar Teaser */}
              <div className="showcase-vibe-radar">
                <div className="radar-header">
                  <span className="radar-pulse-dot" />
                  <span>LIVE CITY VIBE RADAR</span>
                </div>
                <div className="radar-items">
                  <div className="radar-item">
                    <span className="radar-emoji">🔥</span>
                    <div>
                      <strong>Illuzion Nightclub</strong>
                      <span className="radar-status">98% Capacity • Techno Night</span>
                    </div>
                  </div>
                  <div className="radar-item">
                    <span className="radar-emoji">🎧</span>
                    <div>
                      <strong>Mirage Sky Lounge</strong>
                      <span className="radar-status">Live DJ Set • VIP Open</span>
                    </div>
                  </div>
                  <div className="radar-item">
                    <span className="radar-emoji">🥂</span>
                    <div>
                      <strong>Prism Club</strong>
                      <span className="radar-status">Stag & Couple Passes Open</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </>
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
                      <div style={{ background: "rgba(124, 92, 252, 0.1)", color: "var(--primary-light)", width: "40px", height: "40px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>
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
          
          {/* Live Vibe Check Survey Alert Card (Only visible when checked-in AND not submitted AND party is ongoing) */}
          {activeCheckInBooking && (
            <div className="venue-warning-banner animate-role-fade-in" style={{ background: "rgba(125, 92, 252, 0.1)", border: "1px solid rgba(125, 92, 252, 0.3)", color: "white", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <div style={{ display: "flex", gap: "14px", alignItems: "center", textAlign: "left" }}>
                <span style={{ fontSize: "1.7rem", filter: "drop-shadow(0 0 8px rgba(125,92,252,0.4))" }}>⚡</span>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.05rem", color: "white", fontWeight: 800 }}>
                    You are checked-in for <span style={{ color: "var(--primary-light)" }}>"{activeCheckInBooking.event?.title || "Party Event"}"</span> at <span style={{ color: "var(--accent-pink)" }}>{activeCheckInBooking.event?.venue?.name || "the club"}</span>!
                  </h3>
                  <p style={{ margin: "3px 0 0 0", color: "hsl(var(--muted))", fontSize: "0.82rem" }}>
                    How's the crowd, sound volume, and general atmosphere at the scene right now?
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedVibeVenue(activeCheckInBooking.event?.venue);
                  setVibeModalOpen(true);
                }}
                className="guestlist-checkin-btn"
                style={{ width: "auto", padding: "8px 18px", fontSize: "0.8rem" }}
              >
                Report Atmosphere Vibe
              </button>
            </div>
          )}
          
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
                  <HiTicket style={{ color: "var(--primary)", fontSize: "1.2rem" }} /> My Tickets
                </h3>
                
                {myBookings.length === 0 ? (
                  <div className="empty-panel">
                    <p>No active passes. Secure tickets to start your weekend!</p>
                    <Link to="/events" className="empty-panel__btn">Browse Events</Link>
                  </div>
                ) : (
                  <div className="passes-mini-list">
                    {myBookings.slice(0, 2).map((booking) => {
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

              {/* 💬 Quick Squad Chat Hub Inbox */}
              <div className="glass-card" style={{ marginTop: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h3 className="glass-card__title" style={{ margin: 0 }}>
                    <HiUsers style={{ color: "var(--primary-light)", fontSize: "1.2rem" }} /> Squad Chat Inbox 💬
                  </h3>
                  <span style={{ fontSize: "0.7rem", color: "var(--success)", background: "rgba(0, 255, 170, 0.1)", padding: "2px 8px", borderRadius: "12px", border: "1px solid rgba(0, 255, 170, 0.2)" }}>
                    🧹 Auto-Cleans 48h
                  </span>
                </div>

                <p style={{ margin: "0 0 16px 0", fontSize: "0.78rem", color: "hsl(var(--muted))" }}>
                  Quick access to all your active event squad group chats. Chats inactive for over 48 hours automatically archive.
                </p>
                
                {mySquads.length === 0 ? (
                  <div className="empty-panel">
                    <p>No active squad chats. Join or launch a squad to start chatting!</p>
                    <Link to="/events" className="empty-panel__btn">Find a Party Squad</Link>
                  </div>
                ) : (
                  <div className="squads-mini-list">
                    {mySquads.map((squad) => (
                      <div key={squad.id} className="squad-mini-card" style={{ padding: "14px 16px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <h4 style={{ margin: 0, color: "white", fontSize: "0.95rem", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{squad.name}</h4>
                            <span style={{ fontSize: "0.65rem", background: "rgba(125, 92, 252, 0.2)", color: "var(--primary-light)", padding: "2px 6px", borderRadius: "4px" }}>
                              {squad.event?.title ? squad.event.title.slice(0, 15) + "..." : "Party"}
                            </span>
                          </div>
                          <p style={{ margin: "4px 0 0 0", color: "hsl(var(--muted))", fontSize: "0.78rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {squad.last_message ? (
                              <span>💬 <strong>{squad.last_message.user?.full_name?.split(' ')[0]}:</strong> {squad.last_message.message}</span>
                            ) : (
                              <span>✨ No messages yet. Say hi to your squad!</span>
                            )}
                          </p>
                        </div>
                        <Link 
                          to={`/squads/${squad.id}`} 
                          className="pass-mini-card__btn"
                          style={{ textDecoration: "none", padding: "8px 14px", fontSize: "0.8rem", whiteSpace: "nowrap" }}
                        >
                          💬 Chat Now
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



      {/* 4. FOOTER SECTIONS */}
      <footer className="site-footer" ref={marqueeRef}>
        <div className="footer__video-wrap">
          <VideoBackground className="hero__video" flip />
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

        <div className="footer__bar">
          <div className="footer__status">
            <span className="footer__status-dot" />
            <span>Available for bookings</span>
          </div>
          <div className="footer__copyright">
            © 2026 AfterDark. All rights reserved.
          </div>
        </div>
      </footer>

      {/* 5. VIBE SURVEY MODAL OVERLAY */}
      {vibeModalOpen && selectedVibeVenue && (
        <div className="ed-modal-overlay" onClick={() => setVibeModalOpen(false)}>
          <div className="ed-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="ed-modal-header">
              <h2>Atmosphere Vibe Check — {selectedVibeVenue.name}</h2>
              <button className="ed-modal-close" onClick={() => setVibeModalOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleVibeSubmit} className="ed-checkout-form">
              <div className="ed-card-fields">
                
                {/* Vibe Music Genre Select */}
                <div className="create-event__field">
                  <label className="vd-form-lbl">What style of music is playing?</label>
                  <select 
                    value={vibeType}
                    onChange={(e) => setVibeType(e.target.value)}
                    style={{ width: "100%", background: "#1a1a24", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", color: "white" }}
                  >
                    <option value="techno">Techno / House 🍾</option>
                    <option value="bollywood">Bollywood Remixes 💃</option>
                    <option value="hiphop">Hip-Hop & Rap 🎤</option>
                    <option value="chill">Chillout Lounge 🍷</option>
                    <option value="pop">Pop Charts / EDM Hits 🎸</option>
                    <option value="live_band">Live Acoustic Band 🎸</option>
                  </select>
                </div>

                {/* Crowd Density Select */}
                <div className="create-event__field" style={{ marginTop: "16px" }}>
                  <label className="vd-form-lbl">How packed is the dancefloor/lounge?</label>
                  <select 
                    value={vibeCrowd}
                    onChange={(e) => setVibeCrowd(e.target.value)}
                    style={{ width: "100%", background: "#1a1a24", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", color: "white" }}
                  >
                    <option value="empty">Pretty Empty 🍃</option>
                    <option value="cozy">Cozy & Relaxed 🛋️</option>
                    <option value="busy">Busy & Active 🕺</option>
                    <option value="packed">Completely Packed 🔥</option>
                  </select>
                </div>

                {/* Energy Levels Select */}
                <div className="create-event__field" style={{ marginTop: "16px" }}>
                  <label className="vd-form-lbl">What's the energy status?</label>
                  <select 
                    value={vibeEnergy}
                    onChange={(e) => setVibeEnergy(e.target.value)}
                    style={{ width: "100%", background: "#1a1a24", border: "1px solid var(--border)", borderRadius: "8px", padding: "10px 14px", color: "white" }}
                  >
                    <option value="high">High Energy (Wild Night) 🔥</option>
                    <option value="medium">Medium Energy (Active) 🍷</option>
                    <option value="chill">Chill Vibe (Relaxing) 🛋️</option>
                  </select>
                </div>

              </div>

              <button 
                type="submit" 
                className="ed-book-btn" 
                disabled={submittingVibe}
                style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
              >
                {submittingVibe ? "Recording Vibe..." : "Broadcast Live Vibe Check ⚡"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
