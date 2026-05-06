import mongoose from "mongoose";

const voteSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    idea: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Idea",
      required: true,
    },
    value: {
      type: Number,
      enum: {
        values: [1, -1],
        message: "Vote value must be +1 (upvote) or -1 (downvote)",
      },
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

voteSchema.index({ user: 1, idea: 1 }, { unique: true });

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;