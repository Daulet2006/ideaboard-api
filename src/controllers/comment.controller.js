import commentService from "../services/comment.service.js";
import { broadcast } from "../websocket/ws.manager.js";
import { sendSuccess } from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";

const getComments = catchAsync(async (req, res) => {
  const comments = await commentService.getCommentsByIdea(req.params.id);
  sendSuccess(res, 200, "Comments retrieved.", { comments });
});

const addComment = catchAsync(async (req, res) => {
  const comment = await commentService.addComment(req.user._id, req.params.id, req.body.content);

  broadcast({
    type: "NEW_COMMENT",
    payload: {
      ideaId: req.params.id,
      comment,
    },
  });

  sendSuccess(res, 201, "Comment added.", { comment });
});

const deleteComment = catchAsync(async (req, res) => {
  await commentService.deleteComment(req.params.commentId, req.user);
  sendSuccess(res, 200, "Comment deleted.");
});

const updateComment = catchAsync(async (req, res) => {
  const comment = await commentService.updateComment(req.params.commentId, req.user, req.body.content);

  broadcast({
    type: "COMMENT_UPDATED",
    payload: {
      ideaId: comment.idea.toString(),
      comment,
    },
  });

  sendSuccess(res, 200, "Comment updated.", { comment });
});

export { addComment, deleteComment, getComments, updateComment };
