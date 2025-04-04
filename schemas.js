const Joi = require("joi");
const { availableCurrencies } = require("./utils/constants");

// Schema for project validation
module.exports.projectSchema = Joi.object({
    draftId: Joi.string().optional(), // Optional draft ID for updating drafts
    project: Joi.object({
        title: Joi.object().instance(Map).required().messages({
            "any.required": "Title is required and must be a Map.",
        }),
        originalTitle: Joi.string().required().messages({
            "string.empty": "Title is required.",
        }),
        description: Joi.object().instance(Map).required().messages({
            "any.required": "Title is required and must be a Map.",
        }),
        originalDescription: Joi.string().required().messages({
            "string.empty": "Description is required.",
        }),
        location: Joi.string().required().messages({
            "string.empty": "Location is required.",
        }),
        currency: Joi.string()
            .valid(...availableCurrencies)
            .required()
            .messages({
                "string.empty": "Currency is required.",
                "any.only": "Currency must be either USD or THB.",
            }),
        fundingGoal: Joi.number().min(0).required().messages({
            "number.base": "Funding Goal must be a number.",
            "number.min": "Funding Goal must be at least 0.",
            "any.required": "Funding Goal is required.",
        }),
        deadline: Joi.date().greater("now").required().messages({
            "date.base": "Deadline must be a valid date.",
            "date.greater": "Deadline must be in the future.",
            "any.required": "Deadline is required.",
        }),
        status: Joi.string()
            .valid("active", "successful", "failed", "canceled") // Only these statuses are valid
            .default("active")
            .messages({
                "any.only": "Status must be one of: active, successful, failed, canceled.",
            }),
        // keywords: Joi.array()
        //     .items(Joi.string().max(30)) // Each keyword can have a max length of 30
        //     .max(15) // Max 15 keywords
        //     .optional()
        //     .messages({
        //         "array.max": "You can select up to 15 keywords only.",
        //         "string.max": "Each keyword must not exceed 30 characters.",
        //     }),
    })
        .required()
        .messages({
            "object.base": "Project data must be an object.",
            "any.required": "Project data is required.",
        }),
    deleteImages: Joi.array().items(Joi.string()).optional(), // Validate optional image deletions
});

module.exports.commentSchema = Joi.object({
    comment: Joi.object({
        body: Joi.string().required().messages({
            "string.empty": "Comment body is required.",
        }),
    })
        .required()
        .messages({
            "object.base": "Comment data must be an object.",
            "any.required": "Comment data is required.",
        }),
});
