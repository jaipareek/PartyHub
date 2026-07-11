// ============================================
// 🔔 Notification Routes
// ============================================
import { Router } from "express";
import { 
  getMyNotifications, 
  markAllRead, 
  deleteNotification 
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Protect all routes under this router
router.use(protect);

router.get("/", getMyNotifications);
router.put("/mark-read", markAllRead);
router.delete("/:id", deleteNotification);

export default router;
