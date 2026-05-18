import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";
import notificationService from "./notification.service.js";
import { deleteUploadThingFiles, uploadMulterFilesToUploadThing } from "../utils/uploadthing.js";

const register = async ({ username, email, password }) => {
  const normalizedUsername = username?.trim();
  const normalizedEmail = email?.trim().toLowerCase();

  if (!normalizedUsername || !normalizedEmail) {
    throw new AppError("Username and email are required.", 422);
  }

  const existing = await User.findOne({
    $or: [{ email: normalizedEmail }, { username: normalizedUsername }],
  }).lean();
  if (existing) {
    const field = existing.email === normalizedEmail ? "email" : "username";
    throw new AppError(`An account with that ${field} already exists.`, 409);
  }

  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    password,
  });
  const token = signToken(user._id.toString());

  return { token, user: user.toPublicProfile() };
};

const login = async ({ email, password }) => {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new AppError("Email is required.", 422);
  }

  const user = await User.findOne({ email: normalizedEmail }).select("+password");
  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }
  if (user.isBanned) {
    throw new AppError("Your account is banned. Contact support or an administrator.", 403);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signToken(user._id.toString());
  return { token, user: user.toPublicProfile() };
};

const getMe = async (userId) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);
  return user.toPublicProfile();
};

const updateMe = async (userId, updates, avatarFile) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError("User not found.", 404);

  const normalizedUsername = updates.username?.trim();
  const normalizedEmail = updates.email?.trim().toLowerCase();
  let hasChanges = false;

  if (normalizedUsername && normalizedUsername !== user.username) {
    const usernameInUse = await User.exists({ username: normalizedUsername, _id: { $ne: userId } });
    if (usernameInUse) {
      throw new AppError("An account with that username already exists.", 409);
    }
    user.username = normalizedUsername;
    hasChanges = true;
  }

  if (normalizedEmail && normalizedEmail !== user.email) {
    const emailInUse = await User.exists({ email: normalizedEmail, _id: { $ne: userId } });
    if (emailInUse) {
      throw new AppError("An account with that email already exists.", 409);
    }
    user.email = normalizedEmail;
    hasChanges = true;
  }

  const oldAvatarFileKey = user.avatarFileKey;

  if (updates.removeAvatar && user.avatarUrl) {
    user.avatarUrl = "";
    user.avatarFileKey = "";
    hasChanges = true;
  }

  if (avatarFile) {
    const [uploadedAvatar] = await uploadMulterFilesToUploadThing([avatarFile]);
    user.avatarUrl = uploadedAvatar.url;
    user.avatarFileKey = uploadedAvatar.fileKey;
    hasChanges = true;
  }

  if (!hasChanges) {
    throw new AppError("No profile changes were provided.", 422);
  }

  await user.save();

  if (oldAvatarFileKey && oldAvatarFileKey !== user.avatarFileKey) {
    await deleteUploadThingFiles([oldAvatarFileKey]);
  }

  return user.toPublicProfile();
};

const listUsers = async (query) => {
  const {
    page = 1,
    limit = 20,
    search = "",
    role = "",
    isBanned,
  } = query || {};

  const normalizedPage = Math.max(1, Number.parseInt(page, 10) || 1);
  const normalizedLimit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
  const skip = (normalizedPage - 1) * normalizedLimit;

  const filter = {};
  const trimmedSearch = search?.trim();
  if (trimmedSearch) {
    filter.$or = [
      { username: { $regex: trimmedSearch, $options: "i" } },
      { email: { $regex: trimmedSearch, $options: "i" } },
    ];
  }
  if (role) {
    filter.role = role;
  }
  if (typeof isBanned === "boolean") {
    filter.isBanned = isBanned;
  }

  const [users, total] = await Promise.all([
    User.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(normalizedLimit),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map((user) => user.toPublicProfile()),
    meta: {
      total,
      page: normalizedPage,
      limit: normalizedLimit,
      totalPages: Math.ceil(total / normalizedLimit),
    },
  };
};

const updateUserRole = async (actorUser, targetUserId, role) => {
  if (actorUser.role !== "admin") {
    throw new AppError("Only admins can change user roles.", 403);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new AppError("Target user not found.", 404);

  if (targetUser._id.toString() === actorUser._id.toString()) {
    throw new AppError("You cannot change your own role.", 403);
  }

  targetUser.role = role;
  await targetUser.save();
  return targetUser.toPublicProfile();
};

const setBanStatus = async (actorUser, targetUserId, { isBanned, reason = "" }) => {
  if (actorUser.role !== "admin") {
    throw new AppError("Only admins can ban or unban users.", 403);
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) throw new AppError("Target user not found.", 404);

  if (targetUser._id.toString() === actorUser._id.toString()) {
    throw new AppError("You cannot ban yourself.", 403);
  }

  if (targetUser.role === "admin" && isBanned) {
    throw new AppError("Admins cannot ban other admins.", 403);
  }

  targetUser.isBanned = Boolean(isBanned);
  targetUser.bannedAt = targetUser.isBanned ? new Date() : null;
  targetUser.banReason = targetUser.isBanned ? reason.trim() : "";
  await targetUser.save();

  return targetUser.toPublicProfile();
};

const sendNotification = async (senderUser, { recipientId, title, message, type = "direct" }) => {
  if (!["admin", "moderator"].includes(senderUser.role)) {
    throw new AppError("Only moderators and admins can send direct notifications.", 403);
  }

  return notificationService.createNotification({
    recipientId,
    senderId: senderUser._id,
    title,
    message,
    type,
  });
};

const getMyNotifications = async (userId, query) => {
  return notificationService.getNotifications(userId, query);
};

const markNotificationRead = async (userId, notificationId) => {
  return notificationService.markRead(userId, notificationId);
};

const getMyUnreadNotificationCount = async (userId) => {
  return notificationService.getUnreadCount(userId);
};

export default {
  getMe,
  getMyNotifications,
  listUsers,
  login,
  getMyUnreadNotificationCount,
  markNotificationRead,
  register,
  sendNotification,
  setBanStatus,
  updateMe,
  updateUserRole,
};
