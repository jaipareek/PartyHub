import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import {
  HiBuildingStorefront,
  HiPhone,
  HiIdentification,
  HiCheckCircle,
} from "react-icons/hi2";
import GoogleIcon from "../components/ui/GoogleIcon";
import "./Auth.css";

function OwnerSignup() {
  const [step, setStep] = useState(1); // 1=Business Info, 2=Google Sign Up
  const { signInWithGoogle } = useAuth();

  // Step 1: Business verification fields
  const [businessName, setBusinessName] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [businessCity, setBusinessCity] = useState("");
  const [businessRegNo, setBusinessRegNo] = useState("");
  const [ownerPhone, setOwnerPhone] = useState("");
  const [ownerIdProof, setOwnerIdProof] = useState("");

  // ── STEP 1: Validate & save business info ──
  const handleBusinessInfo = (e) => {
    e.preventDefault();
    if (!businessName || !businessAddress || !businessCity || !ownerPhone) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Save details to localStorage to persist through Google OAuth redirect
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
              Step 1 of 2 — Verify your business details
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
                Continue to Sign Up →
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
             STEP 2: Google Sign Up
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
                <span className="auth-card__logo-text"><HiCheckCircle style={{ fontSize: "22px" }} /></span>
              </span>
            </div>

            <h1 className="auth-card__title">
              Almost <em>there!</em>
            </h1>
            <p className="auth-card__subtitle">
              Step 2 of 2 — Sign up with your Google account to complete registration
            </p>

            {/* Summary of business details */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "12px",
              padding: "16px",
              marginBottom: "24px",
              textAlign: "left",
            }}>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "8px" }}>
                Your business details
              </p>
              <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem", fontWeight: 600 }}>
                {businessName}
              </p>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: "4px" }}>
                {businessAddress}, {businessCity}
              </p>
            </div>

            {/* Google Sign Up */}
            <button
              className="auth-google-btn"
              onClick={() => signInWithGoogle("venue_owner")}
              type="button"
            >
              <GoogleIcon /> Sign up with Google
            </button>

            <p className="auth-card__footer" style={{ marginTop: "20px" }}>
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
      </AnimatePresence>
    </div>
  );
}

export default OwnerSignup;
