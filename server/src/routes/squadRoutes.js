// ============================================
// 👥 Squad Routes
// ============================================
import { Router } from "express";
import { 
  createSquad, 
  joinSquad, 
  getSquadDetails, 
  getEventSquads,
  getSquadMessages,
  sendSquadMessage,
  togglePinMessage,
  getMySquads
} from "../controllers/squadController.js";
import { protect } from "../middleware/auth.js";

const router = Router();

// All squad endpoints require authentication
router.use(protect);

router.get("/my/active", getMySquads);
router.post("/", createSquad);
router.post("/:squadId/join", joinSquad);
router.get("/:squadId", getSquadDetails);
router.get("/event/:eventId", getEventSquads);
router.get("/:squadId/messages", getSquadMessages);
router.post("/:squadId/messages", sendSquadMessage);
router.put("/:squadId/messages/:messageId/pin", togglePinMessage);

export default router;
