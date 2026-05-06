import WebSocket, { WebSocketServer } from "ws";

import config from "../config/config.js";
import User from "../models/User.js";
import { verifyToken } from "../utils/jwt.js";

let wss = null;

const onlineUsers = new Map();

const safeSend = (ws, data) => {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
};

const broadcast = (data) => {
  if (!wss) return;
  wss.clients.forEach((client) => safeSend(client, data));
};

const sendToUser = (userId, data) => {
  const sockets = onlineUsers.get(String(userId));
  if (!sockets) return;
  sockets.forEach((ws) => safeSend(ws, data));
};

const getOnlineList = () => ({
  type: "ONLINE_USERS",
  payload: { count: onlineUsers.size, userIds: [...onlineUsers.keys()] },
});

const getTokenFromRequest = (req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const fromQuery = url.searchParams.get("token");

  if (fromQuery) return fromQuery;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  return null;
};

const initWebSocket = (httpServer) => {
  wss = new WebSocketServer({ server: httpServer, path: config.websocket.path });

  wss.on("connection", async (ws, req) => {
    let userId;

    try {
      const token = getTokenFromRequest(req);
      if (!token) {
        ws.close(1008, "Authentication token required.");
        return;
      }

      const decoded = verifyToken(token);
      userId = String(decoded.sub);

      const user = await User.findById(userId).select("isBanned").lean();
      if (!user || user.isBanned) {
        ws.close(1008, "User not allowed.");
        return;
      }
    } catch {
      ws.close(1008, "Invalid token.");
      return;
    }

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(ws);

    broadcast(getOnlineList());

    safeSend(ws, {
      type: "CONNECTED",
      payload: { message: "Connected to Idea Voting Board.", authenticated: true },
    });

    ws.on("message", (raw) => {
      try {
        const msg = JSON.parse(raw);
        if (msg.type === "PING") {
          safeSend(ws, { type: "PONG", payload: { ts: Date.now() } });
        }
      } catch {
        safeSend(ws, { type: "ERROR", payload: { message: "Invalid message format." } });
      }
    });

    ws.on("close", () => {
      const sockets = onlineUsers.get(userId);
      if (sockets) {
        sockets.delete(ws);
        if (sockets.size === 0) onlineUsers.delete(userId);
      }
      broadcast(getOnlineList());
    });

    ws.on("error", (err) => {
      console.error("WebSocket client error:", err.message);
    });
  });

  wss.on("error", (err) => {
    console.error("WebSocket server error:", err.message);
  });

  return wss;
};

export { initWebSocket, broadcast, sendToUser, getOnlineList };
