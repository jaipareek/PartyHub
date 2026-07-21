import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import GoogleIcon from "../components/ui/GoogleIcon";
import toast from "react-hot-toast";
import "./Auth.css";

function Signup() {
  const { signUp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fullName || !email || !password) return;
    try {
      setSubmitting(true);
      await signUp(email, password, fullName, "customer");
      toast.success("Welcome to AfterDark! Profile created. 🌙");
      navigate("/");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to create account. Email may already be in use.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--1" />
      <div className="auth-page__glow auth-page__glow--2" />

      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
      >
        {/* Logo */}
        <div className="auth-card__logo">
          <span className="auth-card__logo-ring">
            <span className="auth-card__logo-text">AD</span>
          </span>
        </div>

        <h1 className="auth-card__title">
          Join the <em>night</em>
        </h1>
        <p className="auth-card__subtitle" style={{ marginBottom: "20px" }}>
          Create your AfterDark account
        </p>

        {/* Email Sign Up Form */}
        <form onSubmit={handleSubmit} className="ed-checkout-form" style={{ width: "100%", textAlign: "left", marginBottom: "20px" }}>
          <div className="create-event__field" style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>Full Name</label>
            <input 
              type="text" 
              placeholder="Jay Pareek" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="create-event__field" style={{ marginBottom: "12px" }}>
            <label style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>Email Address</label>
            <input 
              type="email" 
              placeholder="owl@afterdark.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="create-event__field" style={{ marginBottom: "16px" }}>
            <label style={{ fontSize: "0.75rem", color: "hsl(var(--muted))" }}>Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="ed-pricing__book-btn" style={{ width: "100%", padding: "12px" }} disabled={submitting}>
            {submitting ? "Creating profile..." : "Sign Up"}
          </button>
        </form>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", margin: "16px 0", width: "100%", opacity: 0.4 }}>
          <div style={{ flex: 1, height: "1px", background: "white" }} />
          <span style={{ fontSize: "0.7rem", fontWeight: 700 }}>OR</span>
          <div style={{ flex: 1, height: "1px", background: "white" }} />
        </div>

        {/* Google Sign Up */}
        <button
          className="auth-google-btn"
          onClick={() => signInWithGoogle("customer")}
          type="button"
          style={{ padding: "12px 20px", width: "100%" }}
        >
          <GoogleIcon /> Sign up with Google
        </button>

        <p className="auth-card__footer" style={{ marginTop: "24px" }}>
          Already have an account?{" "}
          <Link to="/login" className="auth-card__link">
            Sign in
          </Link>
        </p>
        <p className="auth-card__footer" style={{ marginTop: "8px" }}>
          <Link to="/owner/signup" className="auth-card__link" style={{ opacity: 0.6 }}>
            🏢 Want to list your venue? Register as owner
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Signup;
