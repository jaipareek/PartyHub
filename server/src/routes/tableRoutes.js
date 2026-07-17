// ============================================
// 🍽️ Table Reservation Routes
// ============================================
import { Router } from "express";
import {
  createReservation,
  getMyReservations,
  getVenueReservations,
  updateReservationStatus,
  getBookedTables
} from "../controllers/tableController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All table reservation routes require authentication
router.use(protect);

router.post("/", createReservation);
router.get("/my", getMyReservations);
router.get("/venue/:venueId", getVenueReservations);
router.get("/venue/:venueId/booked-tables", getBookedTables);
router.put("/:reservationId/status", updateReservationStatus);

export default router;
