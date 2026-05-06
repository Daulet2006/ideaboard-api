import ideaService from "../services/idea.service.js";
import { broadcast } from "../websocket/ws.manager.js";
import { sendSuccess } from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";

const getAllIdeas = catchAsync(async (req, res) => {
  const { ideas, meta } = await ideaService.getAllIdeas(req.query, req.user?._id || null);
  sendSuccess(res, 200, "Ideas retrieved.", { ideas }, meta);
});

const getMyIdeas = catchAsync(async (req, res) => {
  const { ideas, meta } = await ideaService.getIdeasByAuthor(req.user._id, req.query, req.user._id);
  sendSuccess(res, 200, "Your ideas retrieved.", { ideas }, meta);
});

const getIdea = catchAsync(async (req, res) => {
  const idea = await ideaService.getIdeaById(req.params.id, req.user?._id || null);
  sendSuccess(res, 200, "Idea retrieved.", { idea });
});

const createIdea = catchAsync(async (req, res) => {
  const idea = await ideaService.createIdea(req.user._id, req.body, req.files);

  broadcast({ type: "NEW_IDEA", payload: idea });

  sendSuccess(res, 201, "Idea created.", { idea });
});

const updateIdea = catchAsync(async (req, res) => {
  const idea = await ideaService.updateIdea(req.params.id, req.user, req.body, req.files);
  sendSuccess(res, 200, "Idea updated.", { idea });
});

const deleteIdea = catchAsync(async (req, res) => {
  await ideaService.deleteIdea(req.params.id, req.user);
  sendSuccess(res, 200, "Idea deleted.");
});

export { createIdea, deleteIdea, getAllIdeas, getIdea, getMyIdeas, updateIdea };
