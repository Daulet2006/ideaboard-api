import Joi from "joi";

const create = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    "string.min": "Comment cannot be empty",
    "string.max": "Comment cannot exceed 1000 characters",
    "any.required": "Comment content is required",
  }),
  parentComment: Joi.string().hex().length(24).optional().messages({
    "string.hex": "Parent comment id must be a valid ObjectId",
    "string.length": "Parent comment id must be a valid ObjectId",
  }),
});

const update = Joi.object({
  content: Joi.string().min(1).max(1000).required().messages({
    "string.min": "Comment cannot be empty",
    "string.max": "Comment cannot exceed 1000 characters",
    "any.required": "Comment content is required",
  }),
});

export { create, update };
