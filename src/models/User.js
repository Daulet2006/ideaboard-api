import mongoose from "mongoose";
import bcryptjs from "bcryptjs";

import config from "../config/config.js";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [3, "Username must be at least 3 characters"],
      maxlength: [30, "Username cannot exceed 30 characters"],
      match: [/^[a-zA-Z0-9_]+$/, "Username may only contain letters, numbers, and underscores"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    avatarFileKey: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["user", "moderator", "admin"],
      default: "user",
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    bannedAt: {
      type: Date,
      default: null,
    },
    banReason: {
      type: String,
      default: "",
      maxlength: [300, "Ban reason cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

userSchema.virtual("ideas", {
  ref: "Idea",
  localField: "_id",
  foreignField: "author",
});

userSchema.pre("save", async function onSave(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcryptjs.hash(this.password, config.bcrypt.saltRounds);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidatePassword) {
  return bcryptjs.compare(candidatePassword, this.password);
};

userSchema.methods.toPublicProfile = function toPublicProfile() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    avatarUrl: this.avatarUrl,
    role: this.role,
    isBanned: this.isBanned,
    bannedAt: this.bannedAt,
    banReason: this.banReason,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model("User", userSchema);

export default User;
