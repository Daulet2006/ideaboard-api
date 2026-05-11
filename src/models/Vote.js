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
      default: null,
      index: true,
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment",
      default: null,
      index: true,
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

voteSchema.pre("validate", function validateVoteTarget(next) {
  const hasIdea = Boolean(this.idea);
  const hasComment = Boolean(this.comment);

  if (hasIdea === hasComment) {
    this.invalidate("idea", "Vote must target exactly one entity: idea or comment.");
  }

  next();
});

voteSchema.index(
  { user: 1, idea: 1 },
  { unique: true, partialFilterExpression: { idea: { $type: "objectId" } } }
);
voteSchema.index(
  { user: 1, comment: 1 },
  { unique: true, partialFilterExpression: { comment: { $type: "objectId" } } }
);

const Vote = mongoose.model("Vote", voteSchema);

export default Vote;
