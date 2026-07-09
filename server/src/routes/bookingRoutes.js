// ============================================
// 🎟️ Booking Routes
// ============================================
import { Router } from "express";
import { createBooking, getMyBookings, getBookingById } from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All booking endpoints require authentication
router.use(protect);

router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/:id", getBookingById);

export default router;
