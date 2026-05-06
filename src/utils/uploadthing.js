import { UTApi, UTFile } from "uploadthing/server";

import config from "../config/config.js";
import AppError from "./AppError.js";

const buildTokenFromLegacyConfig = () => {
  const { secret, appId, regions, ingestHost } = config.uploadthing;
  if (!secret || !appId) return "";

  const payload = {
    apiKey: secret,
    appId,
    regions: regions.length > 0 ? regions : ["fra1"],
    ingestHost,
  };

  return Buffer.from(JSON.stringify(payload), "utf8").toString("base64");
};

const resolveUploadThingToken = () => config.uploadthing.token || buildTokenFromLegacyConfig();

const getUploadApi = () => {
  const token = resolveUploadThingToken();
  if (!token) {
    throw new AppError(
      "UploadThing is not configured. Set UPLOADTHING_TOKEN or UPLOADTHING_SECRET + UPLOADTHING_APP_ID.",
      500
    );
  }

  return new UTApi({ token });
};

const uploadMulterFilesToUploadThing = async (files = []) => {
  if (!files.length) return [];

  const utapi = getUploadApi();
  const utFiles = files.map(
    (file) => new UTFile([file.buffer], file.originalname, { type: file.mimetype, lastModified: Date.now() })
  );

  const result = await utapi.uploadFiles(utFiles);
  const normalized = Array.isArray(result) ? result : [result];

  const uploaded = [];
  const errors = [];

  normalized.forEach((item) => {
    if (item.error || !item.data) {
      errors.push(item.error?.message || "Upload failed.");
      return;
    }

    uploaded.push({
      fileKey: item.data.key,
      url: item.data.ufsUrl || item.data.url,
      originalName: item.data.name,
      mimeType: item.data.type,
      size: item.data.size,
    });
  });

  if (errors.length > 0) {
    throw new AppError(`Upload failed: ${errors.join("; ")}`, 422);
  }

  return uploaded;
};

const deleteUploadThingFiles = async (fileKeys = []) => {
  const keys = fileKeys.filter(Boolean);
  if (!keys.length) return;

  try {
    const utapi = getUploadApi();
    await utapi.deleteFiles(keys);
  } catch (err) {
    // Keep delete failures non-fatal to avoid blocking primary operations.
    console.error("Failed to delete files from UploadThing:", err?.message || err);
  }
};

export { deleteUploadThingFiles, uploadMulterFilesToUploadThing };
