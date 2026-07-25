// ============================================
// 🎉 PartyHub — Express Server Entry Point
// ============================================

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";

// Route imports
import eventRoutes from "./routes/eventRoutes.js";
import venueRoutes from "./routes/venueRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import reviewRoutes from "./routes/reviewRoutes.js";
import squadRoutes from "./routes/squadRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import tableRoutes from "./routes/tableRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import paylockRoutes from "./routes/paylockRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

// Load environment variables from .env file FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// 🧠 MIDDLEWARE — Functions that run on EVERY request
// ============================================

// 1. HELMET — Adds 11 security headers automatically
//    Example: Prevents clickjacking, XSS attacks, MIME sniffing
//    One line = enterprise-level security. Always use it.
app.use(helmet());

// 2. CORS — Cross-Origin Resource Sharing
//    Your React runs on localhost:5173, Express on localhost:5000
//    Browsers block requests between different origins by default
//    CORS tells the browser: "It's okay, let the frontend talk to me"
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true, // Allow cookies/auth headers
  })
);

// 3. MORGAN — HTTP Request Logger
//    Logs every request: "GET /api/events 200 15ms"
//    "dev" format is colorful and concise — perfect for development
app.use(morgan("dev"));

// 4. JSON PARSER — Without this, req.body is undefined
//    When frontend sends JSON data, Express can't read it by default
//    This middleware parses the JSON and puts it in req.body
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// 5. RATE LIMITER — Prevents API abuse
//    Max 100 requests per 15 minutes per IP
//    Without this, someone could DDoS your server easily
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // High limit for local development and active chat polling
  message: {
    error: "Too many requests, please try again later.",
  },
});
app.use("/api", limiter);

// ============================================
// ROUTES (we'll add these in coming days)
// ============================================

// Health check endpoint — used to verify server is running
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "✅ PartyHub Server is running!",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ✅ Auth routes (Day 4)
app.use("/api/auth", authRoutes);

// ✅ Event routes (Day 2)
app.use("/api/events", eventRoutes);

// ✅ Venue routes (Day 2)
app.use("/api/venues", venueRoutes);

// ✅ Owner routes (Day 10)
app.use("/api/owner", ownerRoutes);

// ✅ Admin routes
app.use("/api/admin", adminRoutes);

// ✅ Booking routes
app.use("/api/bookings", bookingRoutes);

// ✅ Review routes
app.use("/api/reviews", reviewRoutes);

// ✅ Squad routes
app.use("/api/squads", squadRoutes);

// ✅ Notification routes
app.use("/api/notifications", notificationRoutes);

// ✅ Table Reservation routes
app.use("/api/table-reservations", tableRoutes);

// ✅ Analytics routes
app.use("/api/owner/analytics", analyticsRoutes);

// ✅ PayLock Group Bill-Splitter routes
app.use("/api/paylock", paylockRoutes);

// ✅ Razorpay Payment routes
app.use("/api/payment", paymentRoutes);

// TODO: Day 13 — Booking routes
// app.use("/api/bookings", bookingRoutes);

// TODO: Day 16 — Squad routes
// app.use("/api/squads", squadRoutes);

// TODO: Day 20 — Review routes
// app.use("/api/reviews", reviewRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 — Route not found
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    path: req.originalUrl,
  });
});

// Global error handler — catches all unhandled errors
// 🧠 LEARN: This MUST have 4 parameters (err, req, res, next)
// Express recognizes it as an error handler only with 4 params
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.message);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════╗
  ║   🎉 PartyHub Server is LIVE!       ║
  ║   📡 Port: ${PORT}                     ║
  ║   🌍 http://localhost:${PORT}           ║
  ╚══════════════════════════════════════╝
  `);
});

export default app;
