import Notification from "../models/Notification.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { sendToUser } from "../websocket/ws.manager.js";

const NOTIFICATION_TYPES = {
  DIRECT: "direct",
  MODERATION: "moderation",
  SYSTEM: "system",
  LIKE_IDEA: "LIKE_IDEA",
  LIKE_COMMENT: "LIKE_COMMENT",
  REPLY_COMMENT: "REPLY_COMMENT",
};

const NOTIFICATION_ENTITY_TYPES = {
  IDEA: "idea",
  COMMENT: "comment",
};

const populateNotification = (query) => query.populate("sender", "username role avatarUrl");

const createNotification = async ({
  recipientId,
  senderId,
  title,
  message,
  type = NOTIFICATION_TYPES.DIRECT,
  entityId = null,
  entityType = null,
}) => {
  const normalizedRecipientId = String(recipientId);
  const normalizedSenderId = String(senderId);

  if (normalizedRecipientId === normalizedSenderId) return null;

  const recipient = await User.findById(recipientId).select("_id").lean();
  if (!recipient) {
    throw new AppError("Recipient not found.", 404);
  }

  const notification = await Notification.create({
    recipient: recipient._id,
    sender: senderId,
    title: title.trim(),
    message: message.trim(),
    type,
    entityId,
    entityType,
  });

  const populatedNotification = await populateNotification(
    Notification.findById(notification._id)
  ).lean();

  if (!populatedNotification) {
    throw new AppError("Notification not found after creation.", 404);
  }

  sendToUser(recipient._id.toString(), {
    type: "NOTIFICATION",
    payload: { notification: populatedNotification },
  });

  return populatedNotification;
};

const getNotifications = async (userId, query = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, Number.parseInt(query.limit, 10) || 20));
  const skip = (page - 1) * limit;

  const [notifications, total, unreadCount] = await Promise.all([
    populateNotification(
      Notification.find({ recipient: userId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
    ).lean(),
    Notification.countDocuments({ recipient: userId }),
    Notification.countDocuments({ recipient: userId, readAt: null }),
  ]);

  return {
    notifications,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    },
  };
};

const getUnreadCount = async (userId) => {
  const unreadCount = await Notification.countDocuments({ recipient: userId, readAt: null });
  return { unreadCount };
};

const markRead = async (userId, notificationId) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    recipient: userId,
  });

  if (!notification) {
    throw new AppError("Notification not found.", 404);
  }

  if (!notification.readAt) {
    notification.readAt = new Date();
    await notification.save();
  }

  await notification.populate("sender", "username role avatarUrl");
  return notification.toObject();
};

export { NOTIFICATION_ENTITY_TYPES, NOTIFICATION_TYPES };

export default {
  createNotification,
  getNotifications,
  getUnreadCount,
  markRead,
};
