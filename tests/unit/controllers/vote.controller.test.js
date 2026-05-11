import { jest } from "@jest/globals";

import * as voteController from "../../../src/controllers/vote.controller.js";
import voteService from "../../../src/services/vote.service.js";

const flush = () => new Promise((resolve) => setImmediate(resolve));

function createResMock() {
  return {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
}

describe("vote.controller", () => {
  test("castCommentVote records vote and broadcasts update", async () => {
    const payload = {
      commentId: "comment-1",
      ideaId: "idea-1",
      voteState: 1,
      votesCount: 3,
      likesCount: 4,
      dislikesCount: 1,
    };
    const req = {
      user: { _id: "user-1" },
      params: { commentId: "comment-1" },
      body: { value: 1 },
    };
    const res = createResMock();
    const next = jest.fn();

    jest.spyOn(voteService, "castCommentVote").mockResolvedValue(payload);
    voteController.castCommentVote(req, res, next);
    await flush();

    expect(voteService.castCommentVote).toHaveBeenCalledWith("user-1", "comment-1", 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Comment vote recorded.",
      data: payload,
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("castCommentVote passes service errors to next middleware", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { commentId: "comment-1" },
      body: { value: -1 },
    };
    const res = createResMock();
    const next = jest.fn();
    const serviceError = new Error("boom");

    jest.spyOn(voteService, "castCommentVote").mockRejectedValue(serviceError);

    voteController.castCommentVote(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(serviceError);
  });

  test("getMyCommentVote returns vote state", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { commentId: "comment-1" },
    };
    const res = createResMock();
    const next = jest.fn();

    jest.spyOn(voteService, "getUserCommentVote").mockResolvedValue(-1);

    voteController.getMyCommentVote(req, res, next);
    await flush();

    expect(voteService.getUserCommentVote).toHaveBeenCalledWith("user-1", "comment-1");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Comment vote status retrieved.",
      data: { voteState: -1 },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
