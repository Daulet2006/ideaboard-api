import multer from "multer";

import AppError from "../utils/AppError.js";

const normalizeBoolean = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value !== "string") return false;
  return ["true", "1", "yes", "on"].includes(value.toLowerCase());
};

const parseArrayField = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];

  const trimmed = value.trim();
  if (!trimmed) return [];

  try {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) return parsed;
  } catch {
    // Ignore JSON parse errors and use comma parsing fallback.
  }

  return trimmed
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const acceptedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const acceptedIdeaTypes = new Set([
  ...acceptedImageTypes,
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "application/zip",
  "application/x-zip-compressed",
]);

const fileFilterFor = (allowedSet, errorMessage) => (req, file, cb) => {
  if (!allowedSet.has(file.mimetype)) {
    cb(new AppError(errorMessage, 422));
    return;
  }
  cb(null, true);
};

const runMulter = (uploadHandler) => (req, res, next) => {
  uploadHandler(req, res, (err) => {
    if (!err) {
      next();
      return;
    }

    if (err instanceof multer.MulterError) {
      next(new AppError(`Upload failed: ${err.message}`, 422));
      return;
    }

    next(err);
  });
};

const uploadAvatar = runMulter(
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 2 * 1024 * 1024, files: 1 },
    fileFilter: fileFilterFor(acceptedImageTypes, "Avatar must be an image (jpg, png, webp, gif)."),
  }).single("avatar")
);

const uploadIdeaFiles = runMulter(
  multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 5 },
    fileFilter: fileFilterFor(
      acceptedIdeaTypes,
      "Idea files must be image, document, PDF, TXT, or ZIP format."
    ),
  }).array("files", 5)
);

const normalizeIdeaMultipartFields = (req, res, next) => {
  if (typeof req.body.tags === "string") {
    req.body.tags = parseArrayField(req.body.tags);
  }

  req.body.removeFileUrls = parseArrayField(req.body.removeFileUrls);
  next();
};

const normalizeProfileMultipartFields = (req, res, next) => {
  req.body.removeAvatar = normalizeBoolean(req.body.removeAvatar);
  next();
};

export { normalizeIdeaMultipartFields, normalizeProfileMultipartFields, uploadAvatar, uploadIdeaFiles };
