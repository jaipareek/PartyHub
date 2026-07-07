import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { HiUser, HiBuildingStorefront } from "react-icons/hi2";
import "./Auth.css";

function LoginGate() {
  const navigate = useNavigate();

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--1" style={{ background: "rgba(124, 92, 252, 0.15)" }} />
      <div className="auth-page__glow auth-page__glow--2" style={{ background: "rgba(180, 74, 252, 0.1)" }} />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
        style={{ maxWidth: "480px" }}
      >
        <div className="auth-card__logo">
          <span className="auth-card__logo-ring">
            <span className="auth-card__logo-text">AD</span>
          </span>
        </div>

        <h1 className="auth-card__title">
          Sign in to <em>AfterDark</em>
        </h1>
        <p className="auth-card__subtitle" style={{ marginBottom: "32px" }}>
          Choose your account type to proceed
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Customer option */}
          <button
            onClick={() => navigate("/login/user")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "20px",
              background: "var(--glass-strong)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              color: "white",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}
            className="login-gate-card"
          >
            <div style={{
              background: "var(--gradient-primary)",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
            }}>
              <HiUser />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "4px" }}>Night Owl</h3>
              <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted))" }}>Discover events, book tickets & vibe with friends</p>
            </div>
          </button>

          {/* Partner option */}
          <button
            onClick={() => navigate("/owner/login")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "20px",
              padding: "20px",
              background: "var(--glass-strong)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              color: "white",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.2s",
            }}
            className="login-gate-card"
          >
            <div style={{
              background: "linear-gradient(135deg, #f43f5e, #ec4899)",
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "1.4rem",
            }}>
              <HiBuildingStorefront />
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: "1rem", fontWeight: "700", marginBottom: "4px" }}>Venue Partner</h3>
              <p style={{ fontSize: "0.8rem", color: "hsl(var(--muted))" }}>Manage club profile, post events & track ticket sales</p>
            </div>
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default LoginGate;
