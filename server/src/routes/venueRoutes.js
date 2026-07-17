// ============================================
// 🎉 Venue Routes
// ============================================

import { Router } from "express";
import {
  getVenues,
  getVenueById,
  getVenueEvents,
  createVenue,
  updateVenue,
} from "../controllers/venueController.js";
import { protect } from "../middleware/auth.js";
import { submitVibeCheck, getVenueLiveVibe } from "../controllers/vibeController.js";

const router = Router();

router.get("/", getVenues);                  // GET /api/venues
router.get("/:id", getVenueById);            // GET /api/venues/:id
router.get("/:id/events", getVenueEvents);   // GET /api/venues/:id/events
router.get("/:id/live-vibe", getVenueLiveVibe); // GET /api/venues/:id/live-vibe

// Protected routes — require authentication
router.post("/", protect, createVenue);      // POST /api/venues
router.put("/:id", protect, updateVenue);    // PUT /api/venues/:id
router.post("/:id/vibe-check", protect, submitVibeCheck); // POST /api/venues/:id/vibe-check

export default router;

