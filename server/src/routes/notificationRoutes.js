// ============================================
// 🔔 Notification Routes
// ============================================
import { Router } from "express";
import { 
  getMyNotifications, 
  markAllRead, 
  deleteNotification,
  createEventReminder
} from "../controllers/notificationController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Protect all routes under this router
router.use(protect);

router.get("/", getMyNotifications);
router.post("/remind", createEventReminder);
router.put("/mark-read", markAllRead);
router.delete("/:id", deleteNotification);

export default router;
