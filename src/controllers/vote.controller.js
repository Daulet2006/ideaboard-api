import voteService from "../services/vote.service.js";
import { broadcast } from "../websocket/ws.manager.js";
import { sendSuccess } from "../utils/apiResponse.js";
import catchAsync from "../utils/catchAsync.js";

const castVote = catchAsync(async (req, res) => {
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

export { castVote, getMyVote };
