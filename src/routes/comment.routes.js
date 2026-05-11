import { Router } from "express";

import * as commentController from "../controllers/comment.controller.js";
import * as voteController from "../controllers/vote.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { update as updateComment } from "../validators/comment.validator.js";
import { vote as voteSchema } from "../validators/vote.validator.js";

const router = Router();

router.patch("/:commentId", protect, validate(updateComment), commentController.updateComment);
router.delete("/:commentId", protect, commentController.deleteComment);
router.post("/:commentId/vote", protect, validate(voteSchema), voteController.castCommentVote);
router.get("/:commentId/vote", protect, voteController.getMyCommentVote);

export default router;
