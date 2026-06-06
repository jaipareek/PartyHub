import { motion } from "framer-motion";
import {
  HiSparkles,
  HiTicket,
  HiUserGroup,
  HiStar,
  HiMapPin,
  HiMusicalNote,
} from "react-icons/hi2";
import "./Home.css";

// 🧠 LEARN: Framer Motion
// motion.div = a regular <div> but with animation superpowers
// initial = starting state (before animation)
// animate = ending state (after animation)
// transition = how the animation plays (duration, delay, easing)
//
// whileHover = what happens when you hover (no CSS needed!)
// This creates smooth, physics-based animations that CSS can't match

const features = [
  {
    icon: <HiSparkles />,
    title: "Smart Discovery",
    description:
      "Trending events, tonight's picks, weekend specials — all personalized for you.",
  },
  {
    icon: <HiTicket />,
    title: "Instant Booking",
    description:
      "Book tickets and reserve tables in seconds. QR code generated instantly.",
  },
  {
    icon: <HiUserGroup />,
    title: "Squad Planning",
    description:
      "Create a party squad, invite friends, split expenses — all in one place.",
  },
  {
    icon: <HiMusicalNote />,
    title: "Party Meter™",
    description:
      "Know the vibe before you go. See real-time crowd levels at any venue.",
  },
  {
    icon: <HiMapPin />,
    title: "Near You",
    description:
      "Discover events and venues nearby. Never miss what's happening around you.",
  },
  {
    icon: <HiStar />,
    title: "Reviews & Ratings",
    description:
      "Rate music, food, crowd, safety — get an overall PartyHub Score for every venue.",
  },
];

function Home() {
  return (
    <div>
      {/* ── Hero Section ── */}
      <section className="home-hero">
        <div className="hero-content">
          <motion.div
            className="hero-badge"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            🎉 Your Night, Simplified
          </motion.div>

          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Discover Events.{" "}
            <span className="gradient-text">Book Instantly.</span> Bring Your
            Squad.
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            Stop jumping between Instagram, WhatsApp, and Google. PartyHub is
            your one-stop platform to discover nearby events, book tickets,
            reserve tables, and plan with friends.
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <button className="btn-primary">
              <HiSparkles /> Explore Events
            </button>
            <button className="btn-secondary">I'm a Venue Owner</button>
          </motion.div>

          <motion.div
            className="hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Events</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">200+</div>
              <div className="stat-label">Venues</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Party People</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section className="features-section">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          Everything You Need to{" "}
          <span className="gradient-text">Party Smart</span>
        </motion.h2>

        <div className="features-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="feature-card"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              whileHover={{ y: -4 }}
            >
              <div className="feature-icon">{feature.icon}</div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default Home;
