// ============================================
// 🎛️ Owner Routes — Protected dashboard endpoints
// ============================================

import { Router } from "express";
import { 
  getOwnerProfile, 
  getOwnerEvents, 
  getEventAttendees, 
  checkInBooking 
} from "../controllers/ownerController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All owner routes require authentication
router.use(protect);

router.get("/profile", getOwnerProfile);          // GET /api/owner/profile
router.get("/events", getOwnerEvents);            // GET /api/owner/events
router.get("/events/:eventId/attendees", getEventAttendees); // GET /api/owner/events/:eventId/attendees
router.put("/bookings/:code/check-in", checkInBooking);      // PUT /api/owner/bookings/:code/check-in

export default router;
