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
  HiBuildingStorefront,
  HiPhone,
  HiIdentification,
} from "react-icons/hi2";
import GoogleIcon from "../components/ui/GoogleIcon";
import api from "../lib/api";
import "./Auth.css";

function OwnerSignup() {
  const [step, setStep] = useState(1); // 1=Business Info, 2=Account, 3=OTP
  const navigate = useNavigate();
  const { signUp, signInWithGoogle } = useAuth();

  // Step 1: Business verification fields
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerIdProof, setOwnerIdProof] = useState("");

  // Step 2: Account creation fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Step 3: OTP
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", "", "", ""]);

  // ── Helper: Automatically create owner venue in database ──
  const createOwnerVenue = async (accessToken) => {
    try {
      const pendingData = localStorage.getItem("pending_owner_setup");
      if (!pendingData) return;

      const setupData = JSON.parse(pendingData);
      
      // Save access token for API authorization
      localStorage.setItem("access_token", accessToken);

      await api.post("/venues", {
        name: setupData.businessName,
        address: setupData.businessAddress,
        city: setupData.businessCity,
        phone: setupData.ownerPhone,
        business_reg_no: setupData.businessRegNo,
        id_proof: setupData.ownerIdProof,
        category: "club", // default
        images: ["https://images.unsplash.com/photo-1566417713940-fe7c8460ffd3?w=1200"],
      });

      localStorage.removeItem("pending_owner_setup");
    } catch (err) {
      console.error("Error creating owner venue during signup:", err);
      throw new Error("Failed to register venue details");
    }
  };

  // ── STEP 1: Validate & save business info ──
  const handleBusinessInfo = (e) => {
    e.preventDefault();
    if (!businessName || !businessAddress || !businessCity || !ownerPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Save details to localStorage to persist through potential Google OAuth redirect
    localStorage.setItem(
      "pending_owner_setup",
      JSON.stringify({
        businessName,
        businessAddress,
        businessCity,
        businessRegNo,
        ownerPhone,
        ownerIdProof,
      })
    );

    setStep(2);
  };

  // ── STEP 2: Create account ──
  const handleCreateAccount = async (e) => {
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
      const res = await signUp(email, password, fullName, "venue_owner");
      if (res.session) {
        // Automatically create venue since no email confirmation is required
        await createOwnerVenue(res.session.access_token);
        toast.success("Registration complete! Welcome to the Partner Portal 🎉");
        navigate("/owner/dashboard");
      } else {
        toast.success("Verification code sent to your email! 📧");
        setStep(3);
      }
    } catch (error) {
      toast.error(error.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3: Verify OTP ──
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const code = otpCode.join("");
    if (code.length !== 8) {
      toast.error("Please enter the full 8-digit code");
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: "signup",
      });
      if (error) throw error;

      // Automatically create venue on successful verification
      await createOwnerVenue(data.session.access_token);
      toast.success("Verification complete! Welcome to the Partner Portal 🎉");
      navigate("/owner/dashboard");
    } catch (error) {
      toast.error(error.message || "Invalid code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // OTP input handlers
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    if (value && index < 7) {
      document.getElementById(`owner-otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otpCode[index] && index > 0) {
      document.getElementById(`owner-otp-${index - 1}`)?.focus();
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__glow auth-page__glow--1" style={{ background: "rgba(124, 92, 252, 0.15)" }} />
      <div className="auth-page__glow auth-page__glow--2" style={{ background: "rgba(180, 74, 252, 0.1)" }} />

      <AnimatePresence mode="wait">
        {step === 1 && (
          /* ═══════════════════════════
             STEP 1: Business Verification
           ═══════════════════════════ */
          <motion.div
            key="step1"
            className="auth-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            style={{ maxWidth: "460px" }}
          >
            <div className="auth-card__logo">
              <span className="auth-card__logo-ring" style={{ background: "var(--gradient-primary)" }}>
                <span className="auth-card__logo-text"><HiBuildingStorefront style={{ fontSize: "20px" }} /></span>
              </span>
            </div>

            <h1 className="auth-card__title">
              Partner <em>Registration</em>
            </h1>
            <p className="auth-card__subtitle">
              Step 1 of 3 — Verify your business details
            </p>

            <form onSubmit={handleBusinessInfo} className="auth-form">
              <div className="auth-input-group">
                <HiBuildingStorefront className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Business / Venue Name *"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="auth-input"
                  id="owner-signup-business-name"
                />
              </div>

              <div className="auth-input-group">
                <HiIdentification className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Business Registration Number (optional)"
                  value={businessRegNo}
                  onChange={(e) => setBusinessRegNo(e.target.value)}
                  className="auth-input"
                  id="owner-signup-reg-no"
                />
              </div>

              <div className="auth-input-group">
                <HiIdentification className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Venue Address *"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="auth-input"
                  id="owner-signup-address"
                />
              </div>

              <div className="auth-input-group">
                <HiIdentification className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="City *"
                  value={businessCity}
                  onChange={(e) => setBusinessCity(e.target.value)}
                  className="auth-input"
                  id="owner-signup-city"
                />
              </div>

              <div className="auth-input-group">
                <HiPhone className="auth-input-icon" />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  className="auth-input"
                  id="owner-signup-phone"
                />
              </div>

              <div className="auth-input-group">
                <HiIdentification className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="ID Proof (Aadhaar/PAN number, optional)"
                  value={ownerIdProof}
                  onChange={(e) => setOwnerIdProof(e.target.value)}
                  className="auth-input"
                  id="owner-signup-id-proof"
                />
              </div>

              <motion.button type="submit" className="auth-submit" whileTap={{ scale: 0.98 }}>
                Continue to Account Setup →
              </motion.button>
            </form>

            <p className="auth-card__footer">
              Already a partner?{" "}
              <Link to="/owner/login" className="auth-card__link">Sign in</Link>
            </p>
            <p className="auth-card__footer" style={{ marginTop: "8px" }}>
              <Link to="/signup" className="auth-card__link" style={{ opacity: 0.6 }}>
                ← Back to customer signup
              </Link>
            </p>
          </motion.div>
        )}

        {step === 2 && (
          /* ═══════════════════════════
             STEP 2: Account Creation
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
              <span className="auth-card__logo-ring" style={{ background: "var(--gradient-primary)" }}>
                <span className="auth-card__logo-text"><HiUser style={{ fontSize: "20px" }} /></span>
              </span>
            </div>

            <h1 className="auth-card__title">
              Create <em>Account</em>
            </h1>
            <p className="auth-card__subtitle">
              Step 2 of 3 — Set up your partner login
            </p>

            <form onSubmit={handleCreateAccount} className="auth-form">
              <div className="auth-input-group">
                <HiUser className="auth-input-icon" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="auth-input"
                  id="owner-signup-name"
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
                  id="owner-signup-email"
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
                  id="owner-signup-password"
                />
                <button type="button" className="auth-input-toggle" onClick={() => setShowPassword(!showPassword)}>
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
                  id="owner-signup-confirm"
                />
              </div>

              <motion.button type="submit" className="auth-submit" disabled={loading} whileTap={{ scale: 0.98 }}>
                {loading ? <span className="auth-spinner" /> : "Create Account & Verify"}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="auth-divider">
              <span className="auth-divider__line" />
              <span className="auth-divider__text">or</span>
              <span className="auth-divider__line" />
            </div>

            {/* Google Sign Up */}
            <button
              className="auth-google-btn"
              onClick={() => signInWithGoogle("venue_owner")}
              type="button"
            >
              <GoogleIcon /> Sign up with Google
            </button>

            <p className="auth-card__footer" style={{ marginTop: "16px" }}>
              <button
                type="button"
                className="auth-card__link"
                onClick={() => setStep(1)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "inherit", opacity: 0.6 }}
              >
                ← Back to business details
              </button>
            </p>
          </motion.div>
        )}

        {step === 3 && (
          /* ═══════════════════════════
             STEP 3: OTP Verification
           ═══════════════════════════ */
          <motion.div
            key="step3"
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
              Verify <em>email</em>
            </h1>
            <p className="auth-card__subtitle">
              Step 3 of 3 — Enter the 8-digit code sent to <strong>{email}</strong>
            </p>

            <form onSubmit={handleVerifyOtp} className="auth-form">
              <div className="otp-inputs">
                {otpCode.map((digit, index) => (
                  <input
                    key={index}
                    id={`owner-otp-${index}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="otp-input"
                    autoFocus={index === 0}
                  />
                ))}
              </div>

              <motion.button type="submit" className="auth-submit" disabled={loading} whileTap={{ scale: 0.98 }}>
                {loading ? <span className="auth-spinner" /> : "Verify & Continue"}
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default OwnerSignup;
