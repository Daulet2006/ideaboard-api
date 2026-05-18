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
  test("castVote rejects invalid voteType for idea endpoint", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { id: "idea-1" },
      body: { value: 1, voteType: "comment" },
    };
    const res = createResMock();
    const next = jest.fn();

    voteController.castVote(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: "Vote type must be idea for idea votes.",
      })
    );
  });

  test("castCommentVote rejects invalid voteType for comment endpoint", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { commentId: "comment-1" },
      body: { value: 1, voteType: "idea" },
    };
    const res = createResMock();
    const next = jest.fn();

    voteController.castCommentVote(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 422,
        message: "Vote type must be comment for comment votes.",
      })
    );
  });

  test("castVote records idea vote and returns payload", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { id: "idea-1" },
      body: { value: 1, voteType: "idea" },
    };
    const res = createResMock();
    const next = jest.fn();

    jest.spyOn(voteService, "castVote").mockResolvedValue({
      idea: { _id: "idea-1", votesCount: 7 },
      voteState: 1,
    });

    voteController.castVote(req, res, next);
    await flush();

    expect(voteService.castVote).toHaveBeenCalledWith("user-1", "idea-1", 1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Vote recorded.",
      data: {
        idea: { _id: "idea-1", votesCount: 7 },
        voteState: 1,
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("castVote passes service errors to next middleware", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { id: "idea-1" },
      body: { value: 1, voteType: "idea" },
    };
    const res = createResMock();
    const next = jest.fn();
    const serviceError = new Error("idea vote failed");

    jest.spyOn(voteService, "castVote").mockRejectedValue(serviceError);

    voteController.castVote(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(serviceError);
  });

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

  test("getMyVote returns vote state", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { id: "idea-77" },
    };
    const res = createResMock();
    const next = jest.fn();

    jest.spyOn(voteService, "getUserVote").mockResolvedValue(1);

    voteController.getMyVote(req, res, next);
    await flush();

    expect(voteService.getUserVote).toHaveBeenCalledWith("user-1", "idea-77");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: "success",
      message: "Vote status retrieved.",
      data: { voteState: 1 },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test("getMyVote passes service errors to next middleware", async () => {
    const req = {
      user: { _id: "user-1" },
      params: { id: "idea-88" },
    };
    const res = createResMock();
    const next = jest.fn();
    const serviceError = new Error("vote lookup failed");

    jest.spyOn(voteService, "getUserVote").mockRejectedValue(serviceError);

    voteController.getMyVote(req, res, next);
    await flush();

    expect(next).toHaveBeenCalledWith(serviceError);
  });
});
