import voteService from "../services/vote.service.js";
import { broadcast } from "../websocket/ws.manager.js";
import AppError from "../utils/AppError.js";
import { sendSuccess } from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";

const castVote = catchAsync(async (req, res) => {
  if (req.body.voteType && req.body.voteType !== "idea") {
    throw new AppError("Vote type must be idea for idea votes.", 422);
  }

  const { idea, voteState } = await voteService.castVote(req.user._id, req.params.id, req.body.value);

  broadcast({
    type: "VOTE_UPDATE",
    payload: {
      ideaId: idea._id.toString(),
      votesCount: idea.votesCount,
      voteState,
    },
  });

  sendSuccess(res, 200, "Vote recorded.", { idea, voteState });
});

const getMyVote = catchAsync(async (req, res) => {
  const voteState = await voteService.getUserVote(req.user._id, req.params.id);
  sendSuccess(res, 200, "Vote status retrieved.", { voteState });
});

const castCommentVote = catchAsync(async (req, res) => {
  if (req.body.voteType && req.body.voteType !== "comment") {
    throw new AppError("Vote type must be comment for comment votes.", 422);
  }

  const voteData = await voteService.castCommentVote(req.user._id, req.params.commentId, req.body.value);

  broadcast({
    type: "COMMENT_VOTE_UPDATE",
    payload: voteData,
  });

  sendSuccess(res, 200, "Comment vote recorded.", voteData);
});

const getMyCommentVote = catchAsync(async (req, res) => {
  const voteState = await voteService.getUserCommentVote(req.user._id, req.params.commentId);
  sendSuccess(res, 200, "Comment vote status retrieved.", { voteState });
});

export { castVote, castCommentVote, getMyCommentVote, getMyVote };
