// ============================================
// ⚡ Vibe Checks Router
// ============================================
import { Router } from "express";
import { submitVibeCheck, getVenueLiveVibe } from "../controllers/vibeController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Endpoint paths
router.post("/:venueId/vibe-check", protect, submitVibeCheck);
router.get("/:venueId/live-vibe", getVenueLiveVibe);

export default router;
