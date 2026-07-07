// ============================================
// 🎉 Event Routes
// ============================================

import { Router } from "express";
import {
  getEvents,
  getTrendingEvents,
  getTonightEvents,
  getWeekendEvents,
  getStudentDeals,
  getEventById,
  searchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} from "../controllers/eventController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Public read routes
router.get("/", getEvents);
router.get("/trending", getTrendingEvents);
router.get("/tonight", getTonightEvents);
router.get("/weekend", getWeekendEvents);
router.get("/student-deals", getStudentDeals);
router.get("/search", searchEvents);

// Protected CRUD routes (venue owner dashboard)
router.post("/", protect, createEvent);
router.put("/:id", protect, updateEvent);
router.delete("/:id", protect, deleteEvent);

// Dynamic route MUST be last
router.get("/:id", getEventById);

export default router;
