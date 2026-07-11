// ============================================
// 👑 Admin Routes
// ============================================
import { Router } from "express";
import { 
  getVenues, 
  verifyVenue, 
  getPendingStudents, 
  verifyStudent 
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Protect all routes under /api/admin to authenticated admins only
router.use(protect);
router.use(authorize("admin"));

router.get("/venues", getVenues);
router.put("/venues/:id/verify", verifyVenue);
router.get("/students", getPendingStudents);
router.put("/students/:profileId/verify", verifyStudent);

export default router;
