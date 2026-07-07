import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import GoogleIcon from "../components/ui/GoogleIcon";
import "./Auth.css";

function Login() {
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
          Welcome <em>back</em>
        </h1>
        <p className="auth-card__subtitle" style={{ marginBottom: "32px" }}>
          Sign in to continue your night using Google
        </p>

        {/* Google Sign In */}
        <button
          className="auth-google-btn"
          onClick={() => signInWithGoogle("customer")}
          type="button"
          style={{ padding: "16px 20px" }}
        >
          <GoogleIcon /> Continue with Google
        </button>

        {/* Footer */}
        <p className="auth-card__footer" style={{ marginTop: "32px" }}>
          Don't have an account?{" "}
          <Link to="/signup" className="auth-card__link">
            Create one
          </Link>
        </p>
        <p className="auth-card__footer" style={{ marginTop: "8px" }}>
          <Link to="/owner/login" className="auth-card__link" style={{ opacity: 0.6 }}>
            🏢 Sign in as Venue Owner
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
