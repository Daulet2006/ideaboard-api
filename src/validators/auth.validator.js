import Joi from "joi";

const register = Joi.object({
  username: Joi.string().trim().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30).required().messages({
    "string.pattern.base": "Username may only contain letters, numbers, and underscores",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 30 characters",
    "any.required": "Username is required",
  }),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required().messages({
    "string.email": "Must be a valid email address",
    "any.required": "Email is required",
  }),
  password: Joi.string().min(8).max(72).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).required().messages({
    "string.min": "Password must be at least 8 characters",
    "string.pattern.base": "Password must contain uppercase, lowercase and a number",
    "any.required": "Password is required",
  }),
});

const login = Joi.object({
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  password: Joi.string().required(),
});

const updateProfile = Joi.object({
  username: Joi.string().pattern(/^[a-zA-Z0-9_]+$/).min(3).max(30).messages({
    "string.pattern.base": "Username may only contain letters, numbers, and underscores",
    "string.min": "Username must be at least 3 characters",
    "string.max": "Username cannot exceed 30 characters",
  }),
  email: Joi.string().email({ tlds: { allow: false } }).messages({
    "string.email": "Must be a valid email address",
  }),
  removeAvatar: Joi.boolean().default(false),
}).min(1);

const listUsers = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
  search: Joi.string().allow("").max(120).default(""),
  role: Joi.string().valid("user", "moderator", "admin").allow("").default(""),
  isBanned: Joi.boolean().optional(),
});

const updateUserRole = Joi.object({
  role: Joi.string().valid("user", "moderator", "admin").required(),
});

const setBanStatus = Joi.object({
  isBanned: Joi.boolean().required(),
  reason: Joi.string().allow("").max(300).default(""),
});

const sendNotification = Joi.object({
  recipientId: Joi.string().required(),
  title: Joi.string().trim().min(2).max(120).required(),
  message: Joi.string().trim().min(2).max(1000).required(),
  type: Joi.string().valid("direct", "moderation", "system").default("direct"),
});

const notificationsQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(20),
});

export {
  listUsers,
  login,
  notificationsQuery,
  register,
  sendNotification,
  setBanStatus,
  updateProfile,
  updateUserRole,
};
