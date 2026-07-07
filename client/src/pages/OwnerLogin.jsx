import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { HiEnvelope, HiLockClosed, HiEye, HiEyeSlash } from "react-icons/hi2";
import GoogleIcon from "../components/ui/GoogleIcon";
import "./Auth.css";

function OwnerLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn, signOut, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await signIn(email, password);

      // 1. Fetch profile to check role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", res.user.id)
        .single();

      // 2. Reject non-owners
      if (!profile || (profile.role !== "venue_owner" && profile.role !== "admin")) {
        await signOut();
        toast.error("Access denied. Please use the customer login.");
        return;
      }

      // 3. Check if venue exists
      const { data: venue } = await supabase
        .from("venues")
        .select("id")
        .eq("owner_id", res.user.id)
        .single();

      if (venue) {
        toast.success("Welcome back Partner! 🌙");
        navigate("/owner/dashboard");
      } else {
        toast("Welcome! Let's set up your venue first.", { icon: "🏢" });
        navigate("/owner/setup");
      }
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

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

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <HiEnvelope className="auth-input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              autoComplete="email"
              id="owner-login-email"
            />
          </div>

          <div className="auth-input-group">
            <HiLockClosed className="auth-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              autoComplete="current-password"
              id="owner-login-password"
            />
            <button
              type="button"
              className="auth-input-toggle"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <HiEyeSlash /> : <HiEye />}
            </button>
          </div>

          <motion.button
            type="submit"
            className="auth-submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? <span className="auth-spinner" /> : "Sign In to Dashboard"}
          </motion.button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider__line" />
          <span className="auth-divider__text">or</span>
          <span className="auth-divider__line" />
        </div>

        {/* Google Sign In */}
        <button
          className="auth-google-btn"
          onClick={() => signInWithGoogle("venue_owner")}
          type="button"
        >
          <GoogleIcon /> Sign in with Google
        </button>

        <p className="auth-card__footer" style={{ marginTop: "20px" }}>
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
