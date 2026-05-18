import mongoose from "mongoose";

import Vote from "../../../src/models/Vote.js";

const userId = new mongoose.Types.ObjectId();
const ideaId = new mongoose.Types.ObjectId();
const commentId = new mongoose.Types.ObjectId();

describe("Vote model validation", () => {
  test("accepts vote with idea target only and auto-fills voteType", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, value: 1 });
    await expect(vote.validate()).resolves.toBeUndefined();
    expect(vote.voteType).toBe("idea");
  });

  test("accepts vote with comment target only and auto-fills voteType", async () => {
    const vote = new Vote({ user: userId, comment: commentId, value: -1 });
    await expect(vote.validate()).resolves.toBeUndefined();
    expect(vote.voteType).toBe("comment");
  });

  test("accepts vote when voteType is explicitly provided", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, voteType: "idea", value: 1 });
    await expect(vote.validate()).resolves.toBeUndefined();
  });

  test("rejects vote with voteType that does not match idea target", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, voteType: "comment", value: 1 });
    await expect(vote.validate()).rejects.toThrow("Vote type must match target entity: idea");
  });

  test("rejects vote with voteType that does not match comment target", async () => {
    const vote = new Vote({ user: userId, comment: commentId, voteType: "idea", value: -1 });
    await expect(vote.validate()).rejects.toThrow("Vote type must match target entity: comment");
  });

  test("rejects vote when both idea and comment are provided", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, comment: commentId, voteType: "idea", value: 1 });
    await expect(vote.validate()).rejects.toThrow("Vote must target exactly one entity: idea or comment.");
  });

  test("rejects vote when no target is provided", async () => {
    const vote = new Vote({ user: userId, voteType: "idea", value: 1 });
    await expect(vote.validate()).rejects.toThrow("Vote must target exactly one entity: idea or comment.");
  });

  test("rejects vote with invalid value", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, value: 0 });
    await expect(vote.validate()).rejects.toThrow("Vote value must be +1 (upvote) or -1 (downvote)");
  });

  test("rejects vote with unsupported voteType", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, voteType: "post", value: 1 });
    await expect(vote.validate()).rejects.toThrow("Vote type must match target entity: idea");
  });
});
