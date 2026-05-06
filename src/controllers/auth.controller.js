import authService from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";

const register = catchAsync(async (req, res) => {
  const { token, user } = await authService.register(req.body);
  sendSuccess(res, 201, "Registration successful.", { token, user });
});

const login = catchAsync(async (req, res) => {
  const { token, user } = await authService.login(req.body);
  sendSuccess(res, 200, "Login successful.", { token, user });
});

const getMe = catchAsync(async (req, res) => {
  const user = await authService.getMe(req.user._id);
  sendSuccess(res, 200, "Profile retrieved.", { user });
});

const updateMe = catchAsync(async (req, res) => {
  const user = await authService.updateMe(req.user._id, req.body, req.file);
  sendSuccess(res, 200, "Profile updated.", { user });
});

const listUsers = catchAsync(async (req, res) => {
  const { users, meta } = await authService.listUsers(req.query);
  sendSuccess(res, 200, "Users retrieved.", { users }, meta);
});

const updateUserRole = catchAsync(async (req, res) => {
  const user = await authService.updateUserRole(req.user, req.params.userId, req.body.role);
  sendSuccess(res, 200, "User role updated.", { user });
});

const setBanStatus = catchAsync(async (req, res) => {
  const user = await authService.setBanStatus(req.user, req.params.userId, req.body);
  sendSuccess(res, 200, req.body.isBanned ? "User banned." : "User unbanned.", { user });
});

const sendNotification = catchAsync(async (req, res) => {
  const notification = await authService.sendNotification(req.user, req.body);
  sendSuccess(res, 201, "Notification sent.", { notification });
});

const getMyNotifications = catchAsync(async (req, res) => {
  const { notifications, meta } = await authService.getMyNotifications(req.user._id, req.query);
  sendSuccess(res, 200, "Notifications retrieved.", { notifications }, meta);
});

const markNotificationRead = catchAsync(async (req, res) => {
  const notification = await authService.markNotificationRead(req.user._id, req.params.notificationId);
  sendSuccess(res, 200, "Notification marked as read.", { notification });
});

export {
  getMe,
  getMyNotifications,
  listUsers,
  login,
  markNotificationRead,
  register,
  sendNotification,
  setBanStatus,
  updateMe,
  updateUserRole,
};
