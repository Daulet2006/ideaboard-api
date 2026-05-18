import Comment from "../models/Comment.js";
import Idea from "../models/Idea.js";
import User from "../models/User.js";
import Vote from "../models/Vote.js";
import notificationService, {
  NOTIFICATION_ENTITY_TYPES,
  NOTIFICATION_TYPES,
} from "./notification.service.js";
import AppError from "../utils/AppError.js";

const enrichCommentsWithVotes = async (comments, userId = null) => {
  if (!comments.length) return comments;

  const commentIds = comments.map((comment) => comment._id);
  const voteStats = await Vote.aggregate([
    { $match: { comment: { $in: commentIds } } },
    {
      $group: {
        _id: "$comment",
        votesCount: { $sum: "$value" },
        likesCount: {
          $sum: {
            $cond: [{ $eq: ["$value", 1] }, 1, 0],
          },
        },
        dislikesCount: {
          $sum: {
            $cond: [{ $eq: ["$value", -1] }, 1, 0],
          },
        },
      },
    },
  ]);

  const statsMap = new Map(
    voteStats.map((stats) => [
      stats._id.toString(),
      {
        votesCount: stats.votesCount ?? 0,
        likesCount: stats.likesCount ?? 0,
        dislikesCount: stats.dislikesCount ?? 0,
      },
    ])
  );

  const userVoteMap = new Map();
  if (userId) {
    const myVotes = await Vote.find({ user: userId, comment: { $in: commentIds } })
      .select("comment value")
      .lean();

    myVotes.forEach((vote) => {
      userVoteMap.set(vote.comment.toString(), vote.value);
    });
  }

  return comments.map((comment) => {
    const plainComment = typeof comment.toObject === "function" ? comment.toObject() : comment;
    const stats = statsMap.get(plainComment._id.toString());

    return {
      ...plainComment,
      votesCount: stats?.votesCount ?? 0,
      likesCount: stats?.likesCount ?? 0,
      dislikesCount: stats?.dislikesCount ?? 0,
      myVote: userVoteMap.get(plainComment._id.toString()) ?? null,
    };
  });
};

const canModerateContent = (user) => ["admin", "moderator"].includes(user?.role);

const canManageComment = (comment, user) => {
  if (!comment || !user) return false;
  return comment.author.toString() === user._id.toString() || canModerateContent(user);
};

const collectThreadCommentIds = async (rootCommentId) => {
  const collectedIds = [rootCommentId];
  let frontierIds = [rootCommentId];

  while (frontierIds.length > 0) {
    const childComments = await Comment.find({ parentComment: { $in: frontierIds } })
      .select("_id")
      .lean();

    frontierIds = childComments.map((comment) => comment._id);
    collectedIds.push(...frontierIds);
  }

  return collectedIds;
};

const addComment = async (authorId, ideaId, content, parentCommentId = null) => {
  const idea = await Idea.findById(ideaId).select("_id").lean();
  if (!idea) throw new AppError("Idea not found.", 404);

  let parentComment = null;
  if (parentCommentId) {
    parentComment = await Comment.findOne({ _id: parentCommentId, idea: ideaId })
      .select("_id author")
      .lean();

    if (!parentComment) {
      throw new AppError("Parent comment not found for this idea.", 404);
    }
  }

  const comment = await Comment.create({
    content,
    author: authorId,
    idea: ideaId,
    parentComment: parentCommentId || null,
  });

  await comment.populate("author", "username avatarUrl role");

  if (parentComment?.author) {
    const actor = await User.findById(authorId).select("username").lean();
    if (actor?.username) {
      await notificationService.createNotification({
        recipientId: parentComment.author,
        senderId: authorId,
        type: NOTIFICATION_TYPES.REPLY_COMMENT,
        title: "New comment reply",
        message: `${actor.username} replied to your comment.`,
        entityId: comment._id,
        entityType: NOTIFICATION_ENTITY_TYPES.COMMENT,
      });
    }
  }

  const [enrichedComment] = await enrichCommentsWithVotes([comment]);
  return enrichedComment;
};

const deleteComment = async (commentId, currentUser) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new AppError("Comment not found.", 404);

  if (!canManageComment(comment, currentUser)) {
    throw new AppError("You are not allowed to delete this comment.", 403);
  }

  const threadCommentIds = await collectThreadCommentIds(comment._id);

  await Promise.all([
    Vote.deleteMany({ comment: { $in: threadCommentIds } }),
    Comment.deleteMany({ _id: { $in: threadCommentIds } }),
  ]);
};

const updateComment = async (commentId, currentUser, content) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new AppError("Comment not found.", 404);

  if (!canManageComment(comment, currentUser)) {
    throw new AppError("You are not allowed to update this comment.", 403);
  }

  const normalizedContent = typeof content === "string" ? content.trim() : content;
  const hasContentChanged = normalizedContent !== comment.content;
  comment.content = normalizedContent;
  if (hasContentChanged && !comment.isEdited) {
    comment.isEdited = true;
  }
  await comment.save();
  await comment.populate("author", "username avatarUrl role");
  const [enrichedComment] = await enrichCommentsWithVotes([comment], currentUser?._id ?? null);
  return enrichedComment;
};

const getCommentsByIdea = async (ideaId, userId = null) => {
  const idea = await Idea.findById(ideaId).select("_id").lean();
  if (!idea) throw new AppError("Idea not found.", 404);

  const comments = await Comment.find({ idea: ideaId })
    .sort({ createdAt: -1 })
    .populate("author", "username avatarUrl role");

  return enrichCommentsWithVotes(comments, userId);
};

export default { addComment, deleteComment, getCommentsByIdea, updateComment };
