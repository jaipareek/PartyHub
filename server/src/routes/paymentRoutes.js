// ============================================
// 💳 Payment Routes — Razorpay Endpoints
// ============================================
import express from "express";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/paymentController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// POST /api/payment/create-order — Create Razorpay order
router.post("/create-order", protect, createRazorpayOrder);

// POST /api/payment/verify — Verify Razorpay signature
router.post("/verify", protect, verifyRazorpayPayment);

export default router;
