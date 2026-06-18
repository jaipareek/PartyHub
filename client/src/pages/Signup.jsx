import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiEnvelope,
  HiLockClosed,
  HiEye,
  HiEyeSlash,
  HiUser,
  HiShieldCheck,
} from "react-icons/hi2";
import "./Auth.css";

function Signup() {
  // Step 1: Signup details, Step 2: OTP verification
  const [step, setStep] = useState(1);

  // Step 1 fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 2 fields
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", "", "", ""]);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  // ── STEP 1: Create account (sends OTP to email) ──
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!fullName || !email || !password || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    try {
      setLoading(true);
      await signUp(email, password, fullName);
      toast.success("Verification code sent to your email! 📧");
      setStep(2);
    } catch (error) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2: Verify OTP code ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.join("");

    if (code.length !== 8) {
      toast.error("Please enter the full 8-digit code");
      return;
    }

    try {
      setLoading(true);

      // Verify the OTP with Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });

      if (error) throw error;

      toast.success("Account verified! Welcome to AfterDark 🌙");
      navigate("/");
    } catch (error) {
      toast.error(error.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ──
  const handleResend = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
      });
      if (error) throw error;
      toast.success("New code sent! Check your email 📧");
    } catch (error) {
      toast.error(error.message || "Failed to resend code");
    }
  };

  // ── OTP input handler (auto-focus next input) ──
  const handleOtpChange = (index, value) => {
    if (value.length > 1) {
      // Handle paste — distribute digits across inputs
      const digits = value.replace(/\D/g, "").split("").slice(0, 8);
      const newOtp = [...otpCode];
      digits.forEach((digit, i) => {
        if (index + i < 8) newOtp[index + i] = digit;
      });
      setOtpCode(newOtp);
      // Focus last filled input or the next empty one
      const nextIndex = Math.min(index + digits.length, 7);
      document.getElementById(`otp-${nextIndex}`)?.focus();
      return;
    }

    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (value && index < 7) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    // On backspace, go to previous input
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="auth-page">
      {/* Background ambient glow */}
      <div className="auth-page__glow auth-page__glow--1" />
      <div className="auth-page__glow auth-page__glow--2" />

      <AnimatePresence mode="wait">
        {step === 1 ? (
          /* ═══════════════════════════
             STEP 1: Signup Form
           ═══════════════════════════ */
          <motion.div
            key="step1"
            className="auth-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="auth-card__logo">
              <span className="auth-card__logo-ring">
                <span className="auth-card__logo-text">AD</span>
              </span>
            </div>

            <h1 className="auth-card__title">
              Join the <em>night</em>
            </h1>
            <p className="auth-card__subtitle">
              Create your AfterDark account
            </p>

            <form onSubmit={handleSignup} className="auth-form">
              <div className="auth-input-group">
                <HiUser className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="auth-input"
                  autoComplete="name"
                  id="signup-name"
                />
              </div>

              <div className="auth-input-group">
                <HiEnvelope className="auth-input-icon" />
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  autoComplete="email"
                  id="signup-email"
                />
              </div>

              <div className="auth-input-group">
                <HiLockClosed className="auth-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="auth-input"
                  autoComplete="new-password"
                  id="signup-password"
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

              <div className="auth-input-group">
                <HiLockClosed className="auth-input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="auth-input"
                  autoComplete="new-password"
                  id="signup-confirm-password"
                />
              </div>

              <motion.button
                type="submit"
                className="auth-submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <span className="auth-spinner" /> : "Continue"}
              </motion.button>
            </form>

            <p className="auth-card__footer">
              Already have an account?{" "}
              <Link to="/login" className="auth-card__link">
                Sign in
              </Link>
            </p>
          </motion.div>
        ) : (
          /* ═══════════════════════════
             STEP 2: OTP Verification
           ═══════════════════════════ */
          <motion.div
            key="step2"
            className="auth-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
          >
            <div className="auth-card__logo">
              <span className="auth-card__logo-ring">
                <span className="auth-card__logo-text">
                  <HiShieldCheck style={{ fontSize: "22px" }} />
                </span>
              </span>
            </div>

            <h1 className="auth-card__title">
              Verify your <em>email</em>
            </h1>
            <p className="auth-card__subtitle">
              We sent a 8-digit code to <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className="auth-form">
              {/* OTP Input */}
              <div className="otp-inputs">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={index === 0 ? 8 : 1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <motion.button
                type="submit"
                className="auth-submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? <span className="auth-spinner" /> : "Verify & Create Account"}
              </motion.button>
            </form>

            <p className="auth-card__footer">
              Didn't receive the code?{" "}
              <button
                onClick={handleResend}
                className="auth-card__link auth-card__link--btn"
              >
                Resend code
              </button>
            </p>

            <button
              className="auth-back-btn"
              onClick={() => setStep(1)}
            >
              ← Back to signup
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Signup;
