import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { HiEnvelope, HiLockClosed, HiEye, HiEyeSlash } from "react-icons/hi2";
import "./Auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      await signIn(email, password);
      toast.success("Welcome back! 🌙");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Background ambient glow */}
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
        <p className="auth-card__subtitle">
          Sign in to continue your night
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {/* Email */}
          <div className="auth-input-group">
            <HiEnvelope className="auth-input-icon" />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="auth-input"
              autoComplete="email"
              id="login-email"
            />
          </div>

          {/* Password */}
          <div className="auth-input-group">
            <HiLockClosed className="auth-input-icon" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="auth-input"
              autoComplete="current-password"
              id="login-password"
            />
            <button
              type="button"
              className="auth-input-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label="Toggle password visibility"
            >
              {showPassword ? <HiEyeSlash /> : <HiEye />}
            </button>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            className="auth-submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
          >
            {loading ? (
              <span className="auth-spinner" />
            ) : (
              "Sign In"
            )}
          </motion.button>
        </form>

        {/* Footer */}
        <p className="auth-card__footer">
          Don't have an account?{" "}
          <Link to="/signup" className="auth-card__link">
            Create one
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

export default Login;
