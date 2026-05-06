import { Router } from "express";

import * as commentController from "../controllers/comment.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { update as updateComment } from "../validators/comment.validator.js";

const router = Router();

router.patch("/:commentId", protect, validate(updateComment), commentController.updateComment);
router.delete("/:commentId", protect, commentController.deleteComment);

export default router;
