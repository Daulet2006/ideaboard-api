import http from "http";

import app from "./app.js";
import config from "./config/config.js";
import connectDB from "./config/db.js";
import { initWebSocket } from "./websocket/ws.manager.js";

const server = http.createServer(app);

initWebSocket(server);

const start = async () => {
  try {
    await connectDB();

    server.listen(config.port, () => {
      console.log(`Server running in ${config.env} mode on port ${config.port}`);
      console.log(`API path: ${config.api.prefix}`);
      console.log(`WebSocket path: ${config.websocket.path}`);
    });
  } catch (err) {
    console.error(`Failed to start server: ${err.message}`);
    process.exit(1);
  }
};

await start();

const shutdown = (signal) => {
  console.log(`Received ${signal}. Shutting down.`);
  server.close(() => {
    console.log("HTTP server closed.");
    process.exit(0);
  });

  setTimeout(() => {
    console.error("Forcing shutdown after timeout.");
    process.exit(1);
  }, config.shutdownTimeoutMs);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled Promise Rejection:", reason);
  shutdown("unhandledRejection");
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err.message);
  process.exit(1);
});