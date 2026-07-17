import { useState, useEffect, useRef } from "react";
import api from "../../lib/api";
import { HiCamera, HiCheckCircle, HiExclamationTriangle, HiXCircle } from "react-icons/hi2";

function GateScanner() {
  const [libLoaded, setLibLoaded] = useState(false);
  const [activeScan, setActiveScan] = useState(false);
  const [scanResult, setScanResult] = useState(null); // { status: 'success'|'warning'|'error', title: '', desc: '', meta: null }
  const [busy, setBusy] = useState(false);

  const scannerRef = useRef(null);

  // 1. Asynchronously load the html5-qrcode library from CDN
  useEffect(() => {
    const scriptId = "html5-qrcode-cdn-script";
    let script = document.getElementById(scriptId);

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
      script.async = true;
      script.onload = () => setLibLoaded(true);
      document.body.appendChild(script);
    } else {
      setLibLoaded(true);
    }

    return () => {
      stopScanning();
    };
  }, []);

  // 2. Start Scanning (just toggle state to mount element)
  const startScanning = () => {
    if (!libLoaded || activeScan) return;
    setActiveScan(true);
  };

  // Effect to handle initialization AFTER DOM renders the "reader" container
  useEffect(() => {
    let html5QrCode = null;

    if (activeScan && libLoaded) {
      // Small timeout to guarantee DOM repaint completes
      const initTimer = setTimeout(() => {
        const element = document.getElementById("reader");
        if (!element) {
          console.error("Reader element still missing from DOM!");
          setActiveScan(false);
          return;
        }

        try {
          html5QrCode = new window.Html5Qrcode("reader");
          scannerRef.current = html5QrCode;

          const config = { fps: 10, qrbox: { width: 250, height: 250 } };

          html5QrCode.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            onScanFailure
          ).catch((err) => {
            console.error("Camera stream start failed:", err);
            setActiveScan(false);
          });
        } catch (err) {
          console.error("Html5Qrcode initialization failed:", err);
          setActiveScan(false);
        }
      }, 50);

      return () => {
        clearTimeout(initTimer);
        if (html5QrCode && html5QrCode.isScanning) {
          html5QrCode.stop().catch((err) => console.error("Clean stop error:", err));
        }
      };
    }
  }, [activeScan, libLoaded]);

  // 3. Stop Scanning
  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
      } catch (err) {
        console.error("Error stopping scanner:", err);
      } finally {
        scannerRef.current = null;
        setActiveScan(false);
      }
    } else {
      setActiveScan(false);
    }
  };

  // 4. Parser helper
  const extractCode = (decodedText) => {
    if (decodedText.includes("check-in/")) {
      const parts = decodedText.split("check-in/");
      return parts[parts.length - 1].trim();
    }
    return decodedText.trim();
  };

  // 5. Success Callback
  const onScanSuccess = async (decodedText) => {
    // If currently showing a 3-second result overlay, ignore frames
    if (busy) return;

    setBusy(true);
    const passCode = extractCode(decodedText);

    try {
      // Trigger check-in backend API call
      const res = await api.put(`/owner/bookings/${passCode}/check-in`);
      
      if (res.data?.success) {
        const { booking, ticket_tier } = res.data.data;
        const guestName = booking.user?.full_name || "Guest";
        const quantity = booking.quantity || 1;

        if (res.data.data.already_checked_in) {
          // Warning state (Duplicate scan)
          setScanResult({
            status: "warning",
            title: "Duplicate Pass! ⚠️",
            desc: `${guestName} has already checked in.`,
            meta: `Redeemed: ${new Date(booking.checked_in_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
          });
        } else {
          // Success state (Approved)
          setScanResult({
            status: "success",
            title: "Entry Approved! ✅",
            desc: guestName,
            meta: `${quantity}x ${ticket_tier} Pass${quantity > 1 ? "es" : ""}`
          });
        }
      }
    } catch (err) {
      console.error("Scanner check-in error:", err);
      
      const status = err.response?.status;
      const errMsg = err.response?.data?.error || err.response?.data?.message || err.message || "Invalid QR Code format";
      
      if (status === 400 && errMsg.toLowerCase().includes("already checked in")) {
        // Soft duplicate scan warning state (Amber)
        setScanResult({
          status: "warning",
          title: "Duplicate Pass! ⚠️",
          desc: "Ticket already checked in at gate.",
          meta: `Code: ${passCode}`
        });
      } else {
        // Hard error state (Red)
        setScanResult({
          status: "error",
          title: "Access Denied! ❌",
          desc: errMsg,
          meta: `Code: ${passCode}`
        });
      }
    }

    // Auto-clear overlay after 3 seconds and resume scanner
    setTimeout(() => {
      setScanResult(null);
      setBusy(false);
    }, 3000);
  };

  const onScanFailure = (error) => {
    // Drop raw frame decoding noise to keep console clean
  };

  return (
    <div className="gate-scanner-portal" style={{ textAlign: "center", padding: "10px 0" }}>
      
      {!activeScan ? (
        <div className="dashboard-placeholder" style={{ padding: "40px 20px" }}>
          <HiCamera style={{ fontSize: "3rem", color: "hsl(var(--muted))", marginBottom: "16px" }} />
          <h2>Gate Ticket Scanner 🛡️</h2>
          <p style={{ maxWidth: "440px", margin: "8px auto 24px auto", color: "hsl(var(--muted))" }}>
            Turn on camera scanner to perform real-time verification of customer digital ticket passes.
          </p>
          <button 
            onClick={startScanning} 
            className="ed-book-btn"
            style={{ width: "auto", padding: "12px 30px", background: "linear-gradient(135deg, #7d5cfc 0%, #a78bfa 100%)", boxShadow: "0 0 20px rgba(125, 92, 252, 0.3)" }}
            disabled={!libLoaded}
          >
            {!libLoaded ? "Loading Scanner Library..." : "Start Camera Scanner"}
          </button>
        </div>
      ) : (
        <div style={{ position: "relative" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <div style={{ textAlign: "left" }}>
              <h2 style={{ fontSize: "1.35rem", color: "white", margin: 0 }}>🛡️ Gate Scanner Mode</h2>
              <p style={{ margin: "2px 0 0 0", color: "hsl(var(--muted))", fontSize: "0.8rem" }}>Hold the QR code pass in front of your camera frame.</p>
            </div>
            <button 
              onClick={stopScanning} 
              className="dashboard-logout-btn"
              style={{ padding: "8px 16px", color: "white", background: "rgba(255,255,255,0.05)", border: "1px solid var(--border)" }}
            >
              Stop Camera
            </button>
          </div>

          {/* Reader Div Container */}
          <div className="floor-map-wrapper" style={{ padding: "20px", display: "inline-block", background: "#0c0c12", border: "1px solid var(--border)", borderRadius: "16px" }}>
            <div id="reader" style={{ width: "320px", height: "320px", overflow: "hidden", borderRadius: "12px" }} />
          </div>

        </div>
      )}

      {/* ⚠️ HIGH-CONTRAST FULL SCREEN SCAN OVERLAY RESULTS */}
      {scanResult && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: scanResult.status === "success" 
            ? "#10b981" 
            : scanResult.status === "warning" 
            ? "#f59e0b" 
            : "#ef4444",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10500,
          color: "white",
          animation: "fadeIn 0.2s ease-out"
        }}>
          
          <div style={{ textAlign: "center", padding: "24px" }}>
            {scanResult.status === "success" && <HiCheckCircle style={{ fontSize: "6rem", marginBottom: "20px" }} />}
            {scanResult.status === "warning" && <HiExclamationTriangle style={{ fontSize: "6rem", marginBottom: "20px" }} />}
            {scanResult.status === "error" && <HiXCircle style={{ fontSize: "6rem", marginBottom: "20px" }} />}

            <h1 style={{ fontSize: "2.75rem", fontWeight: 900, margin: 0, letterSpacing: "1px", textTransform: "uppercase" }}>
              {scanResult.title}
            </h1>
            
            <p style={{ fontSize: "1.65rem", fontWeight: 700, margin: "16px 0 8px 0" }}>
              {scanResult.desc}
            </p>

            {scanResult.meta && (
              <span style={{ fontSize: "1.1rem", background: "rgba(0,0,0,0.15)", padding: "6px 16px", borderRadius: "20px", fontWeight: 600, display: "inline-block", marginTop: "12px" }}>
                {scanResult.meta}
              </span>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

export default GateScanner;
