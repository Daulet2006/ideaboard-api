import dotenv from "dotenv";

dotenv.config();

const required = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required env variable: ${key}`);
  }
  return value;
};

const optional = (key, fallback = "") => process.env[key] ?? fallback;

const parseIntEnv = (key, fallback, { min = null } = {}) => {
  const raw = optional(key, fallback);
  const parsed = Number.parseInt(raw, 10);

  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid integer env variable: ${key}`);
  }

  if (min !== null && parsed < min) {
    throw new Error(`Env variable ${key} must be >= ${min}`);
  }

  return parsed;
};

const parseMongoUri = () => {
  const uri = required("MONGO_URI").trim();

  if (!uri.startsWith("mongodb://")) {
    throw new Error("MONGO_URI must start with mongodb://");
  }

  if (uri.includes("+srv")) {
    throw new Error("MONGO_URI must not use +srv. Use standard mongodb:// URI.");
  }

  const authorityMatch = uri.match(/^mongodb:\/\/(?:[^@/]+@)?([^/?]+)/i);
  if (!authorityMatch || !authorityMatch[1]) {
    throw new Error("MONGO_URI must include a valid hostname section.");
  }

  const hosts = authorityMatch[1]
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);

  if (!hosts.length) {
    throw new Error("MONGO_URI must include at least one hostname.");
  }

  const hasPlaceholderHost = hosts.some((hostWithPort) => {
    const host = hostWithPort.startsWith("[")
      ? hostWithPort.slice(1, hostWithPort.indexOf("]"))
      : hostWithPort.split(":")[0];
    return host.toLowerCase() === "host";
  });

  if (hasPlaceholderHost) {
    throw new Error(
      "MONGO_URI uses placeholder hostname 'host'. Replace it with your real MongoDB host (for local DB use 127.0.0.1)."
    );
  }

  return uri;
};

const config = {
  env: optional("NODE_ENV", "development"),
  port: parseIntEnv("PORT", "5000", { min: 1 }),
  shutdownTimeoutMs: parseIntEnv("SHUTDOWN_TIMEOUT_MS", "10000", { min: 1000 }),

  api: {
    prefix: optional("API_PREFIX", "/api"),
    bodyLimit: optional("BODY_LIMIT", "10kb"),
  },

  mongo: {
    uri: parseMongoUri(),
    serverSelectionTimeoutMs: parseIntEnv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000", { min: 1000 }),
    socketTimeoutMs: parseIntEnv("MONGO_SOCKET_TIMEOUT_MS", "45000", { min: 1000 }),
  },

  jwt: {
    secret: required("JWT_SECRET"),
    expiresIn: optional("JWT_EXPIRES_IN", "7d"),
  },

  bcrypt: {
    saltRounds: parseIntEnv("SALT_ROUNDS", "12", { min: 8 }),
  },

  cors: {
    clientUrl: required("CLIENT_URL"),
  },

  rateLimit: {
    windowMs: parseIntEnv("RATE_LIMIT_WINDOW_MS", "900000", { min: 1000 }),
    max: parseIntEnv("RATE_LIMIT_MAX", "100", { min: 1 }),
    authMax: parseIntEnv("AUTH_RATE_LIMIT_MAX", "10", { min: 1 }),
  },

  idea: {
    commentsPreviewLimit: parseIntEnv("IDEA_COMMENTS_PREVIEW_LIMIT", "50", { min: 1 }),
  },

  websocket: {
    path: optional("WS_PATH", "/ws"),
  },

  uploadthing: {
    token: optional("UPLOADTHING_TOKEN"),
    secret: optional("UPLOADTHING_SECRET"),
    appId: optional("UPLOADTHING_APP_ID"),
    regions: optional("UPLOADTHING_REGIONS", "fra1")
      .split(",")
      .map((region) => region.trim())
      .filter(Boolean),
    ingestHost: optional("UPLOADTHING_INGEST_HOST", "ingest.uploadthing.com"),
  },

  isDev() {
    return this.env === "development";
  },

  isProd() {
    return this.env === "production";
  },
};

export default config;
