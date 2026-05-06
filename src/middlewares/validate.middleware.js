import AppError from "../utils/AppError.js";
import fs from "fs/promises";

const cleanupUploadedFiles = async (req) => {
  const files = [];

  if (req.file) files.push(req.file);
  if (Array.isArray(req.files)) files.push(...req.files);

  await Promise.all(
    files.map(async (file) => {
      if (!file?.path) return;
      try {
        await fs.unlink(file.path);
      } catch (err) {
        if (err.code !== "ENOENT") {
          console.error("Failed to clean invalid upload file:", err.message);
        }
      }
    })
  );
};

const validate = (schema, source = "body") => {
  return (req, res, next) => {
    schema
      .validateAsync(req[source], {
        abortEarly: false,
        stripUnknown: true,
        convert: true,
      })
      .then((value) => {
        req[source] = value;
        next();
      })
      .catch(async (error) => {
        await cleanupUploadedFiles(req);
        const messages = error.details?.map((d) => d.message).join("; ") || "Validation failed.";
        next(new AppError(messages, 422));
      });
  };
};

export default validate;
