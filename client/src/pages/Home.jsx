import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hls from "hls.js";
import {
  HiSparkles,
  HiArrowRight,
  HiFire,
  HiCalendar,
  HiClock,
  HiMapPin,
  HiTicket,
} from "react-icons/hi2";
import api from "../lib/api";
import EventCard from "../components/ui/EventCard";
import "./Home.css";

gsap.registerPlugin(ScrollTrigger);

const HLS_URL =
  "https://stream.mux.com/Aa02T7oM1wH5Mk5EEVDYhbZ1ChcdhRsS2m1NYyx4Ua1g.m3u8";

const HERO_ROLES = ["Discover", "Book", "Vibe", "Celebrate"];

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
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleIndex, setRoleIndex] = useState(0);

  // Refs for GSAP
  const heroRef = useRef(null);
  const nameRevealRef = useRef(null);
  const marqueeRef = useRef(null);

  // Cycle hero roles
  useEffect(() => {
    const interval = setInterval(() => {
      setRoleIndex((prev) => (prev + 1) % HERO_ROLES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Fetch trending events
  useEffect(() => {
    const fetchTrending = async () => {
      try {
        setLoading(true);
        const res = await api.get("/events/trending");
        setTrendingEvents(res.data.data);
      } catch (err) {
        console.error("Failed to fetch trending events:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  // GSAP hero entrance
  useEffect(() => {
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
  }, []);

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

  // Skeleton loader
  const EventCardSkeleton = () => (
    <div className="event-card-skeleton">
      <div className="event-card-skeleton__image skeleton" />
      <div className="event-card-skeleton__info">
        <div className="event-card-skeleton__title skeleton" />
        <div className="event-card-skeleton__venue skeleton" />
        <div className="event-card-skeleton__time skeleton" />
        <div className="event-card-skeleton__footer">
          <div className="event-card-skeleton__price skeleton" />
          <div className="event-card-skeleton__capacity skeleton" />
        </div>
      </div>
    </div>
  );

  // Get top 4 events for bento and rest for tonight
  const bentoEvents = trendingEvents.slice(0, 4);
  const tonightEvents = trendingEvents.slice(4, 8);

  // Format time helper
  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return minutes === "00"
      ? `${display} ${suffix}`
      : `${display}:${minutes} ${suffix}`;
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    if (d.toDateString() === today.toDateString()) return "Today";
    if (d.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const lowestPrice = (pricing) => {
    if (!pricing || !pricing.length) return 0;
    return Math.min(...pricing.map((p) => p.price));
  };

  return (
    <div className="afterdark-home">
      {/* ═══════════════════════════════════
          SECTION 1: HERO
       ═══════════════════════════════════ */}
      <section className="hero" ref={heroRef}>
        {/* Background Video */}
        <div className="hero__video-wrap">
          <HlsVideo className="hero__video" />
          <div className="hero__overlay" />
          <div className="hero__fade" />
        </div>

        {/* Hero Content */}
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
            <button className="hero__btn hero__btn--solid">
              <HiSparkles /> Explore Events
            </button>
            <button className="hero__btn hero__btn--outline">
              I'm a Venue Owner
            </button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="hero__scroll-indicator blur-in">
          <span>Scroll</span>
          <div className="hero__scroll-line">
            <div className="hero__scroll-dot animate-scroll-down" />
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 2: FEATURED EVENTS (Bento Grid)
       ═══════════════════════════════════ */}
      <section className="featured-section">
        <div className="featured-section__inner">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="section-header__left">
              <div className="section-eyebrow">
                <span className="section-eyebrow__line" />
                <span className="section-eyebrow__text">
                  <HiFire /> Trending Now
                </span>
              </div>
              <h2 className="section-heading">
                Featured <em>events</em>
              </h2>
              <p className="section-subtext">
                The most booked events this week — don't miss out.
              </p>
            </div>
            <button className="section-header__btn hide-mobile">
              <span className="section-header__btn-gradient" />
              <span className="section-header__btn-inner">
                View all events <HiArrowRight />
              </span>
            </button>
          </motion.div>

          {/* Bento Grid */}
          <div className="bento-grid">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`bento-item bento-item--${i % 2 === 0 ? "wide" : "narrow"}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <EventCardSkeleton />
                  </motion.div>
                ))
              : bentoEvents.map((event, index) => (
                  <motion.div
                    key={event.id}
                    className={`bento-item bento-item--${index % 2 === 0 ? "wide" : "narrow"}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <EventCard event={event} />
                  </motion.div>
                ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 3: TONIGHT'S PICKS (Journal style)
       ═══════════════════════════════════ */}
      <section className="tonight-section">
        <div className="tonight-section__inner">
          <motion.div
            className="section-header"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="section-header__left">
              <div className="section-eyebrow">
                <span className="section-eyebrow__line" />
                <span className="section-eyebrow__text">Coming Up</span>
              </div>
              <h2 className="section-heading">
                More <em>events</em>
              </h2>
              <p className="section-subtext">
                Upcoming events across top venues in your city.
              </p>
            </div>
          </motion.div>

          <div className="tonight-list">
            {tonightEvents.map((event, index) => (
              <motion.div
                key={event.id}
                className="tonight-entry"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                whileHover={{ scale: 1.01 }}
              >
                <img
                  src={event.poster_url}
                  alt={event.title}
                  className="tonight-entry__image"
                />
                <div className="tonight-entry__info">
                  <h4 className="tonight-entry__title">{event.title}</h4>
                  <span className="tonight-entry__venue">
                    <HiMapPin />{" "}
                    {event.venues?.name}, {event.venues?.city}
                  </span>
                </div>
                <div className="tonight-entry__meta">
                  <span className="tonight-entry__time">
                    <HiClock /> {formatTime(event.start_time)}
                  </span>
                  <span className="tonight-entry__date">
                    <HiCalendar /> {formatDate(event.date)}
                  </span>
                </div>
                <div className="tonight-entry__price">
                  <HiTicket />
                  <span>₹{lowestPrice(event.pricing)}+</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════
          SECTION 4: STATS
       ═══════════════════════════════════ */}
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

      {/* ═══════════════════════════════════
          SECTION 5: FOOTER
       ═══════════════════════════════════ */}
      <footer className="site-footer" ref={marqueeRef}>
        {/* Background video */}
        <div className="footer__video-wrap">
          <HlsVideo className="hero__video" flip />
          <div className="footer__overlay" />
        </div>

        {/* Marquee */}
        <div className="footer__marquee">
          <div className="marquee-track">
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="marquee-word">
                YOUR NIGHT STARTS HERE •{" "}
              </span>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="footer__cta">
          <motion.button
            className="footer__cta-btn"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <span className="footer__cta-gradient" />
            <span className="footer__cta-inner">
              <HiSparkles /> Explore Events
            </span>
          </motion.button>
        </div>

        {/* Bottom bar */}
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
