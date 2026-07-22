// ============================================
// 💳 PayLock Routes
// ============================================
import { Router } from "express";
import { 
  createPayLockSession, 
  getSquadPayLock, 
  payShare 
} from "../controllers/paylockController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// Protect all paylock routes to authenticated users
router.use(protect);

router.post("/create", createPayLockSession);
router.get("/squad/:squadId", getSquadPayLock);
router.post("/:id/pay-share", payShare);

export default router;
