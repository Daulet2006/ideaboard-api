import { Router } from "express";

import authRoutes from "./auth.routes.js";
import commentRoutes from "./comment.routes.js";
import ideaRoutes from "./idea.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/ideas", ideaRoutes);
router.use("/comments", commentRoutes);

router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

export default router;