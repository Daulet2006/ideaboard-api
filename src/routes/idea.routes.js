import { Router } from "express";

import * as commentController from "../controllers/comment.controller.js";
import * as ideaController from "../controllers/idea.controller.js";
import * as voteController from "../controllers/vote.controller.js";
import { optionalAuth, protect } from "../middlewares/auth.middleware.js";
import { normalizeIdeaMultipartFields, uploadIdeaFiles } from "../middlewares/upload.middleware.js";
import validate from "../middlewares/validate.middleware.js";
import { create as createComment } from "../validators/comment.validator.js";
import { create as createIdea, query as queryIdea, update as updateIdea } from "../validators/idea.validator.js";
import { vote as voteSchema } from "../validators/vote.validator.js";

const router = Router();

router.get("/", optionalAuth, validate(queryIdea, "query"), ideaController.getAllIdeas);
router.get("/me", protect, validate(queryIdea, "query"), ideaController.getMyIdeas);
router.get("/:id", optionalAuth, ideaController.getIdea);
router.post(
  "/",
  protect,
  uploadIdeaFiles,
  normalizeIdeaMultipartFields,
  validate(createIdea),
  ideaController.createIdea
);
router.patch(
  "/:id",
  protect,
  uploadIdeaFiles,
  normalizeIdeaMultipartFields,
  validate(updateIdea),
  ideaController.updateIdea
);
router.delete("/:id", protect, ideaController.deleteIdea);

router.post("/:id/vote", protect, validate(voteSchema), voteController.castVote);
router.get("/:id/vote", protect, voteController.getMyVote);

router.get("/:id/comments", optionalAuth, commentController.getComments);
router.post("/:id/comments", protect, validate(createComment), commentController.addComment);

export default router;
