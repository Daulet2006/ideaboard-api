import mongoose from "mongoose";

import Vote from "../../../src/models/Vote.js";

const userId = new mongoose.Types.ObjectId();
const ideaId = new mongoose.Types.ObjectId();
const commentId = new mongoose.Types.ObjectId();

describe("Vote model validation", () => {
  test("accepts vote with idea target only", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, value: 1 });
    await expect(vote.validate()).resolves.toBeUndefined();
  });

  test("accepts vote with comment target only", async () => {
    const vote = new Vote({ user: userId, comment: commentId, value: -1 });
    await expect(vote.validate()).resolves.toBeUndefined();
  });

  test("rejects vote when both idea and comment are provided", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, comment: commentId, value: 1 });
    await expect(vote.validate()).rejects.toThrow("Vote must target exactly one entity: idea or comment.");
  });

  test("rejects vote when no target is provided", async () => {
    const vote = new Vote({ user: userId, value: 1 });
    await expect(vote.validate()).rejects.toThrow("Vote must target exactly one entity: idea or comment.");
  });

  test("rejects vote with invalid value", async () => {
    const vote = new Vote({ user: userId, idea: ideaId, value: 0 });
    await expect(vote.validate()).rejects.toThrow("Vote value must be +1 (upvote) or -1 (downvote)");
  });
});

