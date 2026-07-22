// ============================================
// ⚡ Vibe Checks Router
// ============================================
import { Router } from "express";
import { submitVibeCheck, getVenueLiveVibe, getMySubmittedVibes } from "../controllers/vibeController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Endpoint paths
router.get("/my-submitted-vibes", protect, getMySubmittedVibes);
router.post("/:venueId/vibe-check", protect, submitVibeCheck);
router.get("/:venueId/live-vibe", getVenueLiveVibe);

export default router;
