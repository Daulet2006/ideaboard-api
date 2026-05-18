import { Router } from "express";

import * as authController from "../controllers/auth.controller.js";
import { protect, restrictTo } from "../middlewares/auth.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.middleware.js";
import { normalizeProfileMultipartFields, uploadAvatar } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import {
  listUsers,
  login,
  notificationsQuery,
  register,
  sendNotification,
  setBanStatus,
  updateProfile,
  updateUserRole,
} from "../validators/auth.validator.js";

const router = Router();

router.post("/register", authLimiter, validate(register), authController.register);
router.post("/login", authLimiter, validate(login), authController.login);
router.get("/me", protect, authController.getMe);
router.patch(
  "/me",
  protect,
  uploadAvatar,
  normalizeProfileMultipartFields,
  validate(updateProfile),
  authController.updateMe
);
router.get("/users", protect, restrictTo("admin", "moderator"), validate(listUsers, "query"), authController.listUsers);
router.patch(
  "/users/:userId/role",
  protect,
  restrictTo("admin"),
  validate(updateUserRole),
  authController.updateUserRole
);
router.patch(
  "/users/:userId/ban",
  protect,
  restrictTo("admin"),
  validate(setBanStatus),
  authController.setBanStatus
);
router.post(
  "/notifications",
  protect,
  restrictTo("admin", "moderator"),
  validate(sendNotification),
  authController.sendNotification
);
router.get(
  "/notifications",
  protect,
  validate(notificationsQuery, "query"),
  authController.getMyNotifications
);
router.get(
  "/notifications/unread-count",
  protect,
  authController.getMyUnreadNotificationCount
);
router.patch(
  "/notifications/:notificationId/read",
  protect,
  authController.markNotificationRead
);

export default router;
