import Comment from "../models/Comment.js";
import Idea from "../models/Idea.js";
import AppError from "../utils/AppError.js";

const canModerateContent = (user) => ["admin", "moderator"].includes(user?.role);

const canManageComment = (comment, user) => {
  if (!comment || !user) return false;
  return comment.author.toString() === user._id.toString() || canModerateContent(user);
};

const addComment = async (authorId, ideaId, content) => {
  const idea = await Idea.findById(ideaId).select("_id").lean();
  if (!idea) throw new AppError("Idea not found.", 404);

  const comment = await Comment.create({ content, author: authorId, idea: ideaId });
  await comment.populate("author", "username avatarUrl role");

  return comment;
};

const deleteComment = async (commentId, currentUser) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new AppError("Comment not found.", 404);

  if (!canManageComment(comment, currentUser)) {
    throw new AppError("You are not allowed to delete this comment.", 403);
  }

  await comment.deleteOne();
};

const updateComment = async (commentId, currentUser, content) => {
  const comment = await Comment.findById(commentId);
  if (!comment) throw new AppError("Comment not found.", 404);

  if (!canManageComment(comment, currentUser)) {
    throw new AppError("You are not allowed to update this comment.", 403);
  }

  comment.content = content;
  await comment.save();
  await comment.populate("author", "username avatarUrl role");

  return comment;
};

const getCommentsByIdea = async (ideaId) => {
  const idea = await Idea.findById(ideaId).select("_id").lean();
  if (!idea) throw new AppError("Idea not found.", 404);

  return Comment.find({ idea: ideaId })
    .sort({ createdAt: -1 })
    .populate("author", "username avatarUrl role")
    .lean();
};

export default { addComment, deleteComment, getCommentsByIdea, updateComment };
