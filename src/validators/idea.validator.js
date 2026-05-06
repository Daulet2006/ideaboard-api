import Joi from "joi";

const create = Joi.object({
  title: Joi.string().min(5).max(120).required().messages({
    "string.min": "Title must be at least 5 characters",
    "string.max": "Title cannot exceed 120 characters",
    "any.required": "Title is required",
  }),
  description: Joi.string().min(10).max(2000).required().messages({
    "string.min": "Description must be at least 10 characters",
    "string.max": "Description cannot exceed 2000 characters",
    "any.required": "Description is required",
  }),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(10).default([]).messages({
    "array.max": "Cannot have more than 10 tags",
  }),
});

const update = Joi.object({
  title: Joi.string().min(5).max(120),
  description: Joi.string().min(10).max(2000),
  tags: Joi.array().items(Joi.string().trim().lowercase().max(30)).max(10),
  removeFileUrls: Joi.array().items(Joi.string().trim().max(500)).max(20).default([]),
}).min(1);

const query = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  sort: Joi.string().valid("votes", "date", "-votes", "-date").default("-date"),
  search: Joi.string().max(100).allow("").optional(),
  tags: Joi.alternatives().try(Joi.array().items(Joi.string()), Joi.string()).optional(),
});

export { create, update, query };
