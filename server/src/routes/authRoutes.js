// ============================================
// 🔐 Auth Routes
// ============================================
import express from "express";
import { signup, login, getProfile, updateProfile } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Public routes (no auth needed)
router.post("/signup", signup);
router.post("/login", login);

// Protected routes (must be logged in)
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);

export default router;
