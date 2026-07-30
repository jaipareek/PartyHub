// ============================================
// 🎟️ Booking Routes
// ============================================
import { Router } from "express";
import { createBooking, getMyBookings, getBookingById, cancelBooking } from "../controllers/bookingController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All booking endpoints require authentication
router.use(protect);

router.post("/", createBooking);
router.get("/my-bookings", getMyBookings);
router.get("/:id", getBookingById);
router.put("/:id/cancel", cancelBooking);

export default router;
