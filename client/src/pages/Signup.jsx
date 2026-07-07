import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import { HiSparkles } from "react-icons/hi2";
import GoogleIcon from "../components/ui/GoogleIcon";
import "./Auth.css";

function Signup() {
  const { signInWithGoogle } = useAuth();

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
        <p className="auth-card__subtitle" style={{ marginBottom: "32px" }}>
          Create your AfterDark account instantly using Google
        </p>

        {/* Google Sign Up */}
        <button
          className="auth-google-btn"
          onClick={() => signInWithGoogle("customer")}
          type="button"
          style={{ padding: "16px 20px" }}
        >
          <GoogleIcon /> Sign up with Google
        </button>

        <p className="auth-card__footer" style={{ marginTop: "32px" }}>
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
