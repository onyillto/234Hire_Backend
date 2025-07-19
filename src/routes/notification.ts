
import express from "express";
import { protect } from "../middlewares/auth";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from "../controllers/notification";

const router = express.Router();

router.use(protect); // All routes require authentication

router.get("/", getNotifications);
router.put("/:id/read", markNotificationRead);
router.put("/read-all", markAllNotificationsRead);

export default router;
