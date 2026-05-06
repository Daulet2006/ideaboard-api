import mongoose from "mongoose";

import Idea from "../models/Idea.js";
import Vote from "../models/Vote.js";
import AppError from "../utils/AppError.js";

const castVote = async (userId, ideaId, value) => {
  const session = await mongoose.startSession();
  let result = null;

  try {
    await session.withTransaction(async () => {
      const idea = await Idea.findById(ideaId).session(session);
      if (!idea) throw new AppError("Idea not found.", 404);

      if (idea.author.toString() === userId.toString()) {
        throw new AppError("You cannot vote on your own idea.", 403);
      }

      const existingVote = await Vote.findOne({ user: userId, idea: ideaId }).session(session);

      let delta;
      let voteState;

      if (!existingVote) {
        await Vote.create([{ user: userId, idea: ideaId, value }], { session });
        delta = value;
        voteState = value;
      } else if (existingVote.value === value) {
        await existingVote.deleteOne({ session });
        delta = -value;
        voteState = null;
      } else {
        existingVote.value = value;
        await existingVote.save({ session });
        delta = value * 2;
        voteState = value;
      }

      const updatedIdea = await Idea.findByIdAndUpdate(
        ideaId,
        { $inc: { votesCount: delta } },
        { new: true, session }
      ).populate("author", "username avatarUrl");

      if (!updatedIdea) {
        throw new AppError("Idea not found after vote update.", 404);
      }

      result = { idea: updatedIdea, voteState };
    });

    return result;
  } finally {
    await session.endSession();
  }
};

const getUserVote = async (userId, ideaId) => {
  const vote = await Vote.findOne({ user: userId, idea: ideaId }).lean();
  return vote ? vote.value : null;
};

export default { castVote, getUserVote };
