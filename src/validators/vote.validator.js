import Joi from "joi";

const vote = Joi.object({
  value: Joi.number().valid(1, -1).required().messages({
    "any.only": "Vote value must be 1 (upvote) or -1 (downvote)",
    "any.required": "Vote value is required",
  }),
  voteType: Joi.string().valid("idea", "comment").optional().messages({
    "any.only": "Vote type must be idea or comment",
  }),
});

export { vote };
