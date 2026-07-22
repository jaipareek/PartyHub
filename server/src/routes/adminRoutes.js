// ============================================
// 👑 Admin Routes
// ============================================
import { Router } from "express";
import { 
  getVenues, 
  verifyVenue, 
  getPendingStudents, 
  verifyStudent,
  getAdminStats,
  getAllEventsAdmin,
  toggleEventStatus,
  getAllUsersAdmin,
  updateUserRole
} from "../controllers/adminController.js";
import { protect, authorize } from "../middleware/auth.js";

const router = Router();

// Protect all routes under /api/admin to authenticated admins only
router.use(protect);
router.use(authorize("admin"));

router.get("/stats", getAdminStats);
router.get("/venues", getVenues);
router.put("/venues/:id/verify", verifyVenue);
router.get("/students", getPendingStudents);
router.put("/students/:profileId/verify", verifyStudent);

router.get("/events", getAllEventsAdmin);
router.put("/events/:id/toggle", toggleEventStatus);

router.get("/users", getAllUsersAdmin);
router.put("/users/:id/role", updateUserRole);

export default router;
