import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catchAsync.js";
import { verifyToken } from "../utils/jwt.js";

const protect = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new AppError("Authentication required. Please log in.", 401));
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return next(new AppError("Your session has expired. Please log in again.", 401));
    }
    return next(new AppError("Invalid token. Please log in.", 401));
  }

  const user = await User.findById(decoded.sub).select("+role");
  if (!user) {
    return next(new AppError("The user belonging to this token no longer exists.", 401));
  }
  if (user.isBanned) {
    return next(new AppError("Your account is banned. Contact support or an administrator.", 403));
  }

  req.user = user;
  next();
});

const optionalAuth = catchAsync(async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next();
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch {
    return next();
  }

  const user = await User.findById(decoded.sub).select("+role");
  if (user && !user.isBanned) {
    req.user = user;
  }

  next();
});

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError("You do not have permission to perform this action.", 403));
    }
    next();
  };
};

export { optionalAuth, protect, restrictTo };
