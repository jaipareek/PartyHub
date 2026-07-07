import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Hls from "hls.js";
import {
  HiSparkles,
  HiArrowRight,
} from "react-icons/hi2";
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
  const navigate = useNavigate();
  const { isAuthenticated, profile } = useAuth();
  const [roleIndex, setRoleIndex] = useState(0);

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
            {!isAuthenticated ? (
              <>
                <button className="hero__btn hero__btn--solid" onClick={() => navigate("/signup")}>
                  <HiSparkles /> Get Started
                </button>
                <button className="hero__btn hero__btn--outline" onClick={() => navigate("/owner/login")}>
                  I'm a Venue Owner
                </button>
              </>
            ) : (
              profile?.role === "venue_owner" || profile?.role === "admin" ? (
                <button className="hero__btn hero__btn--solid" onClick={() => navigate("/owner/dashboard")}>
                  Go to Partner Dashboard →
                </button>
              ) : (
                <button className="hero__btn hero__btn--solid" onClick={() => navigate("/events")}>
                  Explore Events →
                </button>
              )
            )}
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
