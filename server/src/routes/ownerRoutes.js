// ============================================
// 🎛️ Owner Routes — Protected dashboard endpoints
// ============================================

import { Router } from "express";
import { getOwnerProfile, getOwnerEvents } from "../controllers/ownerController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All owner routes require authentication
router.use(protect);

router.get("/profile", getOwnerProfile);   // GET /api/owner/profile
router.get("/events", getOwnerEvents);     // GET /api/owner/events

export default router;
