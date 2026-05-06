import mongoose from "mongoose";

const ideaSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      minlength: [5, "Title must be at least 5 characters"],
      maxlength: [120, "Title cannot exceed 120 characters"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      trim: true,
      minlength: [10, "Description must be at least 10 characters"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    votesCount: {
      type: Number,
      default: 0,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: (tags) => tags.length <= 10,
        message: "An idea cannot have more than 10 tags",
      },
      set: (tags) => [...new Set(tags.map((tag) => tag.toLowerCase().trim()))],
    },
    files: {
      type: [
        {
          fileKey: { type: String, default: "" },
          url: { type: String, required: true },
          originalName: { type: String, required: true },
          mimeType: { type: String, required: true },
          size: { type: Number, required: true },
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

ideaSchema.index({ title: "text", description: "text" });
ideaSchema.index({ votesCount: -1 });
ideaSchema.index({ createdAt: -1 });
ideaSchema.index({ tags: 1 });

ideaSchema.virtual("comments", {
  ref: "Comment",
  localField: "_id",
  foreignField: "idea",
});

const Idea = mongoose.model("Idea", ideaSchema);

export default Idea;
