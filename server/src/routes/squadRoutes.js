// ============================================
// 👥 Squad Routes
// ============================================
import { Router } from "express";
import { 
  createSquad, 
  joinSquad, 
  getSquadDetails, 
  getEventSquads 
} from "../controllers/squadController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All squad endpoints require authentication
router.use(protect);

router.post("/", createSquad);
router.post("/:squadId/join", joinSquad);
router.get("/:squadId", getSquadDetails);
router.get("/event/:eventId", getEventSquads);

export default router;
