import express from "express";
import { protectRoute } from "../middlewares/protectRoute.js";
import { deleteANotification, deleteNotifications, getNotifications } from "../controllers/notificationController.js";

const router = express.Router();

router.get('/', protectRoute, getNotifications);
router.delete('/', protectRoute, deleteNotifications);
router.delete('/:id', protectRoute, deleteANotification)

export default router;