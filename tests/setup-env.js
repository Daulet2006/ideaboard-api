process.env.NODE_ENV = "test";
process.env.PORT = process.env.PORT || "5000";
process.env.SHUTDOWN_TIMEOUT_MS = process.env.SHUTDOWN_TIMEOUT_MS || "10000";
process.env.API_PREFIX = process.env.API_PREFIX || "/api";
process.env.BODY_LIMIT = process.env.BODY_LIMIT || "10kb";
process.env.MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/idea-voting-board-test";
process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS = process.env.MONGO_SERVER_SELECTION_TIMEOUT_MS || "5000";
process.env.MONGO_SOCKET_TIMEOUT_MS = process.env.MONGO_SOCKET_TIMEOUT_MS || "45000";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-jwt-secret";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
process.env.SALT_ROUNDS = process.env.SALT_ROUNDS || "12";
process.env.CLIENT_URL = process.env.CLIENT_URL || "http://localhost:3000";
process.env.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS || "900000";
process.env.RATE_LIMIT_MAX = process.env.RATE_LIMIT_MAX || "500";
process.env.AUTH_RATE_LIMIT_MAX = process.env.AUTH_RATE_LIMIT_MAX || "50";
process.env.IDEA_COMMENTS_PREVIEW_LIMIT = process.env.IDEA_COMMENTS_PREVIEW_LIMIT || "50";
process.env.WS_PATH = process.env.WS_PATH || "/ws";

