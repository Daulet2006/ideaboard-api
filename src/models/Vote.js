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
    voteType: {
      type: String,
      enum: {
        values: ["idea", "comment"],
        message: "Vote type must be either idea or comment",
      },
      required: [true, "Vote type is required"],
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
    return next();
  }

  const resolvedVoteType = hasIdea ? "idea" : "comment";
  if (!this.voteType) {
    this.voteType = resolvedVoteType;
  }

  if (this.voteType !== resolvedVoteType) {
    this.invalidate("voteType", `Vote type must match target entity: ${resolvedVoteType}`);
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
