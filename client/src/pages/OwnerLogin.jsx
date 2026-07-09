import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import GoogleIcon from "../components/ui/GoogleIcon";
import "./Auth.css";

function OwnerLogin() {
  const { signInWithGoogle } = useAuth();

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--1" style={{ background: "rgba(124, 92, 252, 0.15)" }} />
      <div className="auth-page__glow auth-page__glow--2" style={{ background: "rgba(180, 74, 252, 0.1)" }} />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        <div className="auth-card__logo">
          <span className="auth-card__logo-ring" style={{ background: "var(--gradient-primary)" }}>
            <span className="auth-card__logo-text">AD</span>
          </span>
        </div>

        <h1 className="auth-card__title">
          Partner <em>Portal</em>
        </h1>
        <p className="auth-card__subtitle">
          Sign in to manage your venue on AfterDark
        </p>

        {/* Google Sign In */}
        <button
          className="auth-google-btn"
          onClick={() => signInWithGoogle("venue_owner")}
          type="button"
          style={{ marginTop: "24px" }}
        >
          <GoogleIcon /> Continue with Google
        </button>

        <p className="auth-card__footer" style={{ marginTop: "24px" }}>
          Not a partner yet?{" "}
          <Link to="/owner/signup" className="auth-card__link">
            Register here
          </Link>
        </p>
        <p className="auth-card__footer" style={{ marginTop: "8px" }}>
          <Link to="/login" className="auth-card__link" style={{ opacity: 0.6 }}>
            ← Back to customer login
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default OwnerLogin;
