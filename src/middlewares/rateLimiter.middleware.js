import rateLimit from "express-rate-limit";

import config from "../config/config.js";
import AppError from "../utils/AppError.js";

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError("Too many requests from this IP. Please try again later.", 429));
  },
});

const authLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.authMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(new AppError("Too many authentication attempts. Please try again later.", 429));
  },
});

export { apiLimiter, authLimiter };