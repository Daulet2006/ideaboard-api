import cors from "cors";
import express from "express";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import morgan from "morgan";
import path from "path";

import config from "./config/config.js";
import globalErrorHandler from "./middlewares/error.middleware.js";
import { apiLimiter } from "./middlewares/rateLimiter.middleware.js";
import routes from "./routes/index.js";
import AppError from "./utils/AppError.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: config.cors.clientUrl,
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(morgan(config.isDev() ? "dev" : "combined"));

app.use(express.json({ limit: config.api.bodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.api.bodyLimit }));

app.use(mongoSanitize());
app.use("/uploads", express.static(path.resolve(process.cwd(), "uploads")));

app.use(config.api.prefix, apiLimiter);
app.use(config.api.prefix, routes);

app.all("*", (req, res, next) => {
  next(new AppError(`Route ${req.method} ${req.originalUrl} not found.`, 404));
});

app.use(globalErrorHandler);

export default app;
