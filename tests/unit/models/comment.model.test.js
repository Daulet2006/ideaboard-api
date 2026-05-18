import mongoose from "mongoose";

import Comment from "../../../src/models/Comment.js";

const authorId = new mongoose.Types.ObjectId();
const ideaId = new mongoose.Types.ObjectId();
const parentCommentId = new mongoose.Types.ObjectId();

describe("Comment model validation", () => {
  test("creates comment with isEdited default false", async () => {
    const comment = new Comment({
      content: "Looks good",
      author: authorId,
      idea: ideaId,
    });

    await expect(comment.validate()).resolves.toBeUndefined();
    expect(comment.isEdited).toBe(false);
  });

  test("accepts comment with parentComment", async () => {
    const comment = new Comment({
      content: "Reply message",
      author: authorId,
      idea: ideaId,
      parentComment: parentCommentId,
    });

    await expect(comment.validate()).resolves.toBeUndefined();
  });

  test("rejects empty content", async () => {
    const comment = new Comment({
      content: "",
      author: authorId,
      idea: ideaId,
    });

    await expect(comment.validate()).rejects.toThrow("Comment content is required");
  });

  test("rejects content over 1000 chars", async () => {
    const comment = new Comment({
      content: "a".repeat(1001),
      author: authorId,
      idea: ideaId,
    });

    await expect(comment.validate()).rejects.toThrow("Comment cannot exceed 1000 characters");
  });

  test("rejects missing author", async () => {
    const comment = new Comment({
      content: "Message",
      idea: ideaId,
    });

    await expect(comment.validate()).rejects.toThrow("Path `author` is required");
  });

  test("rejects missing idea", async () => {
    const comment = new Comment({
      content: "Message",
      author: authorId,
    });

    await expect(comment.validate()).rejects.toThrow("Path `idea` is required");
  });
});
