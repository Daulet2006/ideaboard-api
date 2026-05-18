import { jest } from "@jest/globals";

import Comment from "../../../src/models/Comment.js";
import Vote from "../../../src/models/Vote.js";
import commentService from "../../../src/services/comment.service.js";

const userId = "665f4f4f4f4f4f4f4f4f4f41";
const anotherUserId = "665f4f4f4f4f4f4f4f4f4f42";

describe("comment.service updateComment", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("marks comment as edited when content changed", async () => {
    const commentDoc = {
      _id: "comment-1",
      content: "old text",
      isEdited: false,
      author: { toString: () => userId },
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(undefined),
      toObject: () => ({
        _id: "comment-1",
        content: "new text",
        isEdited: true,
        author: { _id: userId, username: "user" },
      }),
    };

    jest.spyOn(Comment, "findById").mockResolvedValue(commentDoc);
    jest.spyOn(Vote, "aggregate").mockResolvedValue([]);
    jest.spyOn(Vote, "find").mockReturnValue({
      select: () => ({ lean: async () => [] }),
    });

    const updated = await commentService.updateComment("comment-1", { _id: userId, role: "user" }, "new text");

    expect(commentDoc.content).toBe("new text");
    expect(commentDoc.isEdited).toBe(true);
    expect(commentDoc.save).toHaveBeenCalledTimes(1);
    expect(updated.isEdited).toBe(true);
  });

  test("does not set isEdited when content is unchanged", async () => {
    const commentDoc = {
      _id: "comment-2",
      content: "same text",
      isEdited: false,
      author: { toString: () => userId },
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(undefined),
      toObject: () => ({
        _id: "comment-2",
        content: "same text",
        isEdited: false,
        author: { _id: userId, username: "user" },
      }),
    };

    jest.spyOn(Comment, "findById").mockResolvedValue(commentDoc);
    jest.spyOn(Vote, "aggregate").mockResolvedValue([]);
    jest.spyOn(Vote, "find").mockReturnValue({
      select: () => ({ lean: async () => [] }),
    });

    const updated = await commentService.updateComment("comment-2", { _id: userId, role: "user" }, "same text");

    expect(commentDoc.isEdited).toBe(false);
    expect(updated.isEdited).toBe(false);
  });

  test("throws 403 when user is not allowed to edit comment", async () => {
    const commentDoc = {
      _id: "comment-3",
      content: "text",
      isEdited: false,
      author: { toString: () => userId },
      save: jest.fn().mockResolvedValue(undefined),
      populate: jest.fn().mockResolvedValue(undefined),
    };

    jest.spyOn(Comment, "findById").mockResolvedValue(commentDoc);

    await expect(
      commentService.updateComment("comment-3", { _id: anotherUserId, role: "user" }, "new")
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "You are not allowed to update this comment.",
    });

    expect(commentDoc.save).not.toHaveBeenCalled();
  });
});
