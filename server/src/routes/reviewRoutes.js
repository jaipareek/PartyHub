// ============================================
// ⭐️ Review Routes
// ============================================
import { Router } from "express";
import { 
  createReview, 
  getVenueReviews, 
  checkEligibleForReview 
} from "../controllers/reviewController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Public route to fetch reviews
router.get("/venue/:venueId", getVenueReviews);

// Protected routes requiring authentication
router.post("/", protect, createReview);
router.get("/venue/:venueId/check-eligibility", protect, checkEligibleForReview);

export default router;
