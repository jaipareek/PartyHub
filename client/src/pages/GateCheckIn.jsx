import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../lib/api";
import { HiCheckCircle, HiXCircle, HiExclamationTriangle, HiArrowLeft } from "react-icons/hi2";
import "./GateCheckIn.css";

function GateCheckIn() {
  const { code } = useParams();
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [status, setStatus] = useState("loading"); // loading, success, already_checked_in, error
  const [bookingData, setBookingData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      // Store checkout redirect
      navigate(`/login?redirect=/owner/check-in/${code}`);
      return;
    }

    if (profile?.role !== "venue_owner" && profile?.role !== "admin") {
      setStatus("error");
      setErrorMsg("Access Denied. Only registered Venue Partners can verify ticket check-ins.");
      return;
    }

    performCheckIn();
  }, [code, user, profile, authLoading, navigate]);

  const performCheckIn = async () => {
    try {
      setStatus("loading");
      const res = await api.put(`/owner/bookings/${code}/check-in`);
      if (res.data?.success) {
        setBookingData(res.data.data);
        setStatus("success");
      }
    } catch (err) {
      console.error("Check-in error:", err);
      const serverData = err.response?.data;
      if (serverData && serverData.error && serverData.error.includes("already checked in")) {
        setBookingData(serverData.data);
        setStatus("already_checked_in");
      } else {
        setStatus("error");
        setErrorMsg(serverData?.error || "Verification failed. Invalid or expired booking pass.");
      }
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-IN", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "";
    if (timeStr.includes("T")) {
      return new Date(timeStr).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
    }
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const suffix = h >= 12 ? "PM" : "AM";
    const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return `${display}:${minutes} ${suffix}`;
  };

  if (authLoading || status === "loading") {
    return (
      <div className="gate-checkin-page">
        <div className="gate-checkin-container">
          <div className="gate-checkin-card loading-state">
            <div className="gate-checkin-spinner" />
            <h2>Verifying Ticket Code...</h2>
            <p className="gate-checkin-code">{code}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gate-checkin-page">
      <div className="gate-checkin-container">
        {status === "success" && (
          <div className="gate-checkin-card success-state">
            <HiCheckCircle className="gate-checkin-status-icon" />
            <h2 className="gate-checkin-title">Entry Approved! 🥂</h2>
            <p className="gate-checkin-subtitle">Ticket checked in successfully</p>
            
            <div className="gate-checkin-details">
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Guest Name</span>
                <span className="gate-checkin-value">{bookingData?.user?.full_name || "Friend"}</span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Event</span>
                <span className="gate-checkin-value">{bookingData?.event?.title || "Night Out"}</span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Pass Type</span>
                <span className="gate-checkin-value">
                  {bookingData?.tier_type} · {bookingData?.quantity} Pass{bookingData?.quantity > 1 ? "es" : ""}
                </span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Pass Code</span>
                <span className="gate-checkin-value code-font">{bookingData?.booking_code}</span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Gate Arrival</span>
                <span className="gate-checkin-value">{formatTime(bookingData?.checked_in_at)}</span>
              </div>
            </div>

            <Link to="/owner/dashboard" className="gate-checkin-btn">
              <HiArrowLeft /> Back to Dashboard
            </Link>
          </div>
        )}

        {status === "already_checked_in" && (
          <div className="gate-checkin-card warning-state">
            <HiExclamationTriangle className="gate-checkin-status-icon" />
            <h2 className="gate-checkin-title">Already Checked In!</h2>
            <p className="gate-checkin-subtitle" style={{ color: "var(--warning)" }}>This pass was scanned previously</p>
            
            <div className="gate-checkin-details">
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Guest Name</span>
                <span className="gate-checkin-value">{bookingData?.user?.full_name || "Friend"}</span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Event</span>
                <span className="gate-checkin-value">{bookingData?.event?.title || "Night Out"}</span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Pass Type</span>
                <span className="gate-checkin-value">
                  {bookingData?.tier_type} · {bookingData?.quantity} Pass{bookingData?.quantity > 1 ? "es" : ""}
                </span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Pass Code</span>
                <span className="gate-checkin-value code-font">{bookingData?.booking_code}</span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Checked In At</span>
                <span className="gate-checkin-value">{formatTime(bookingData?.checked_in_at)}</span>
              </div>
            </div>

            <Link to="/owner/dashboard" className="gate-checkin-btn">
              <HiArrowLeft /> Back to Dashboard
            </Link>
          </div>
        )}

        {status === "error" && (
          <div className="gate-checkin-card error-state">
            <HiXCircle className="gate-checkin-status-icon" />
            <h2 className="gate-checkin-title">Check-In Failed</h2>
            <p className="gate-checkin-subtitle" style={{ color: "#ef4444" }}>{errorMsg}</p>
            
            <div className="gate-checkin-details">
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Scanned Code</span>
                <span className="gate-checkin-value code-font">{code}</span>
              </div>
              <div className="gate-checkin-row">
                <span className="gate-checkin-label">Status</span>
                <span className="gate-checkin-value" style={{ color: "#ef4444", fontWeight: 700 }}>INVALID ENTRY</span>
              </div>
            </div>

            <Link to="/owner/dashboard" className="gate-checkin-btn">
              <HiArrowLeft /> Back to Dashboard
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default GateCheckIn;
