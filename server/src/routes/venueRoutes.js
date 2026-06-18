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

const router = Router();

router.get("/", getVenues);                  // GET /api/venues
router.get("/:id", getVenueById);            // GET /api/venues/:id
router.get("/:id/events", getVenueEvents);   // GET /api/venues/:id/events

// These will be protected with auth middleware (Day 3)
router.post("/", createVenue);               // POST /api/venues
router.put("/:id", updateVenue);             // PUT /api/venues/:id

export default router;
