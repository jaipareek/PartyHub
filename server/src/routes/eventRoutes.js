// ============================================
// 🎉 Event Routes
// ============================================
// 🧠 LEARN: Express Router
// Router lets you group related routes together
// Instead of defining all routes in index.js (messy),
// we create separate route files for each feature
//
// These routes get MOUNTED at /api/events in index.js
// So Router.get("/trending") becomes GET /api/events/trending

import { Router } from "express";
import {
  getEvents,
  getTrendingEvents,
  getTonightEvents,
  getWeekendEvents,
  getStudentDeals,
  getEventById,
  searchEvents,
} from "../controllers/eventController.js";

const router = Router();

// 🧠 LEARN: Route order MATTERS!
// Specific routes (like /trending) must come BEFORE dynamic routes (like /:id)
// Because /:id would match "trending" as an ID otherwise!

router.get("/", getEvents);                    // GET /api/events
router.get("/trending", getTrendingEvents);    // GET /api/events/trending
router.get("/tonight", getTonightEvents);      // GET /api/events/tonight
router.get("/weekend", getWeekendEvents);      // GET /api/events/weekend
router.get("/student-deals", getStudentDeals); // GET /api/events/student-deals
router.get("/search", searchEvents);           // GET /api/events/search?q=...
router.get("/:id", getEventById);              // GET /api/events/:id (MUST be last!)

export default router;
