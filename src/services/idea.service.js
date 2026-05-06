import config from "../config/config.js";
import Comment from "../models/Comment.js";
import Idea from "../models/Idea.js";
import Vote from "../models/Vote.js";
import AppError from "../utils/AppError.js";
import { deleteUploadThingFiles, uploadMulterFilesToUploadThing } from "../utils/uploadthing.js";

const buildQuery = (params) => {
  const { page = 1, limit = 10, sort = "-date", search, tags } = params;

  const filter = {};

  if (search && search.trim()) {
    filter.$text = { $search: search.trim() };
  }

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    filter.tags = { $in: tagArray.map((tag) => tag.toLowerCase().trim()) };
  }

  const sortMap = {
    votes: { votesCount: -1 },
    "-votes": { votesCount: 1 },
    date: { createdAt: 1 },
    "-date": { createdAt: -1 },
  };

  const sortObj = sortMap[sort] || { createdAt: -1 };

  return { filter, sortObj, page: Number(page), limit: Number(limit) };
};

const canModerateContent = (user) => ["admin", "moderator"].includes(user?.role);

const canManageIdea = (idea, user) => {
  if (!idea || !user) return false;
  return idea.author.toString() === user._id.toString() || canModerateContent(user);
};

const withUserVotes = async (ideas, userId) => {
  if (!userId || ideas.length === 0) return ideas;

  const ideaIds = ideas.map((idea) => idea._id);
  const votes = await Vote.find({ user: userId, idea: { $in: ideaIds } }).select("idea value").lean();
  const voteMap = new Map(votes.map((vote) => [vote.idea.toString(), vote.value]));

  return ideas.map((idea) => ({
    ...idea,
    myVote: voteMap.get(idea._id.toString()) ?? null,
  }));
};

const getAllIdeas = async (queryParams, userId = null) => {
  const { filter, sortObj, page, limit } = buildQuery(queryParams);
  const skip = (page - 1) * limit;

  const [rawIdeas, total] = await Promise.all([
    Idea.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("author", "username avatarUrl role")
      .lean(),
    Idea.countDocuments(filter),
  ]);

  const ideas = await withUserVotes(rawIdeas, userId);

  return {
    ideas,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getIdeasByAuthor = async (authorId, queryParams, userId = null) => {
  const { filter, sortObj, page, limit } = buildQuery(queryParams);
  filter.author = authorId;

  const skip = (page - 1) * limit;

  const [rawIdeas, total] = await Promise.all([
    Idea.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limit)
      .populate("author", "username avatarUrl role")
      .lean(),
    Idea.countDocuments(filter),
  ]);

  const ideas = await withUserVotes(rawIdeas, userId);

  return {
    ideas,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getIdeaById = async (ideaId, userId = null) => {
  const idea = await Idea.findById(ideaId)
    .populate("author", "username avatarUrl role")
    .populate({
      path: "comments",
      populate: { path: "author", select: "username avatarUrl role" },
      options: { sort: { createdAt: -1 }, limit: config.idea.commentsPreviewLimit },
    });

  if (!idea) throw new AppError("Idea not found.", 404);

  const plainIdea = idea.toObject();
  if (!userId) {
    plainIdea.myVote = null;
    return plainIdea;
  }

  const vote = await Vote.findOne({ user: userId, idea: ideaId }).select("value").lean();
  plainIdea.myVote = vote ? vote.value : null;

  return plainIdea;
};

const createIdea = async (authorId, body, uploadedFiles = []) => {
  const files = await uploadMulterFilesToUploadThing(uploadedFiles);
  const idea = await Idea.create({ ...body, author: authorId, files });
  await idea.populate("author", "username avatarUrl role");
  return idea;
};

const updateIdea = async (ideaId, currentUser, updates, uploadedFiles = []) => {
  const idea = await Idea.findById(ideaId);
  if (!idea) throw new AppError("Idea not found.", 404);

  if (!canManageIdea(idea, currentUser)) {
    throw new AppError("You are not allowed to update this idea.", 403);
  }

  const removableFiles = Array.isArray(updates.removeFileUrls) ? updates.removeFileUrls : [];
  const removableOwnedFiles = idea.files.filter((file) => removableFiles.includes(file.url));

  if (removableFiles.length > 0) {
    const removableKeySet = new Set(removableOwnedFiles.map((file) => file.fileKey));
    idea.files = idea.files.filter((file) => !removableKeySet.has(file.fileKey));
  }

  if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
    const mappedFiles = await uploadMulterFilesToUploadThing(uploadedFiles);
    idea.files.push(...mappedFiles);
  }

  Object.assign(idea, {
    title: updates.title ?? idea.title,
    description: updates.description ?? idea.description,
    tags: updates.tags ?? idea.tags,
  });

  await idea.save();
  await idea.populate("author", "username avatarUrl role");

  if (removableOwnedFiles.length > 0) {
    await deleteUploadThingFiles(removableOwnedFiles.map((file) => file.fileKey));
  }

  return idea;
};

const deleteIdea = async (ideaId, currentUser) => {
  const idea = await Idea.findById(ideaId);
  if (!idea) throw new AppError("Idea not found.", 404);

  if (!canManageIdea(idea, currentUser)) {
    throw new AppError("You are not allowed to delete this idea.", 403);
  }

  await deleteUploadThingFiles(idea.files.map((file) => file.fileKey));
  await Vote.deleteMany({ idea: idea._id });
  await Comment.deleteMany({ idea: idea._id });
  await idea.deleteOne();
};

export default { createIdea, deleteIdea, getAllIdeas, getIdeaById, getIdeasByAuthor, updateIdea };
