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

const router = Router();

router.get("/", getVenues);                  // GET /api/venues
router.get("/:id", getVenueById);            // GET /api/venues/:id
router.get("/:id/events", getVenueEvents);   // GET /api/venues/:id/events

// Protected routes — require authentication
router.post("/", protect, createVenue);      // POST /api/venues
router.put("/:id", protect, updateVenue);    // PUT /api/venues/:id

export default router;

