// ============================================
// 📈 Analytics Router
// ============================================
import { Router } from "express";
import { getVenueAnalytics } from "../controllers/analyticsController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Secure analytics under protection guard
router.get("/:venueId", protect, getVenueAnalytics);

export default router;
