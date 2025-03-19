const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// Schema for image thumbnails
const ImageSchema = new Schema({
    url: String,
    filename: String,
});

ImageSchema.virtual("thumbnail").get(function () {
    return this.url.replace("/upload", "/upload/w_200");
});

const opts = { toJSON: { virtuals: true } };
const ProjectSchema = new Schema(
    {
        title: {
            type: Map,
            of: String,
            required: function () {
                return !this.get("isDraft"); // Use this.get() for safe access
            },
        },
        originalTitle: {
            type: String,
            required: function () {
                return !this.get("isDraft");
            },
        },
        description: {
            type: Map,
            of: String,
            required: function () {
                return !this.get("isDraft");
            },
        },
        originalDescription: {
            type: String,
            required: function () {
                return !this.get("isDraft");
            },
        },
        images: [ImageSchema],
        geometry: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
                required: function () {
                    return !this.get("isDraft");
                },
            },
            coordinates: {
                type: [Number],
                default: [-113.1331, 47.0202],
                required: function () {
                    return !this.get("isDraft");
                },
            },
        },
        currency: {
            type: String,
            required: function () {
                return !this.get("isDraft");
            },
        },
        fundingGoal: {
            type: Number,
            required: function () {
                return !this.get("isDraft");
            },
        },
        location: {
            type: String,
            required: function () {
                return !this.get("isDraft");
            },
        },
        deadline: {
            type: Date,
            required: function () {
                return !this.get("isDraft");
            },
        },
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        author: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "successful", "failed", "canceled"],
            default: "active",
        },
        comments: [
            {
                type: Schema.Types.ObjectId,
                ref: "Comment",
            },
        ],
        categories: {
            type: Map,
            of: [String], // Ensures each key (category) has an array of keywords
            default: () => new Map(), // Avoids undefined values
        },
        isDraft: { type: Boolean, default: false },
        lastSavedAt: { type: Date, default: Date.now },
        embedding: [Number],
    },
    opts
);

// // Categories list
// const categories = require("../path/to/categories.js");

// // Virtual field to determine categories dynamically
// ProjectSchema.virtual("categories").get(function () {
//     const projectKeywords = this.keywords || [];
//     const matchingCategories = [];

//     // Iterate through categories and check for keyword matches
//     for (const [category, keywords] of Object.entries(categories)) {
//         if (projectKeywords.some((keyword) => keywords.includes(keyword))) {
//             matchingCategories.push(category);
//         }
//     }

//     return matchingCategories;
// });

// Text index for enabling full-text search
ProjectSchema.index({ title: "text", description: "text", location: "text" });

// Virtual property for map popups
ProjectSchema.virtual("properties.popUpMarkup").get(function () {
    return `<strong><a href="/projects/${this._id}">${this.title}</a></strong>`;
});

// Middleware to delete associated comments when a project is deleted
ProjectSchema.post("findOneAndDelete", async function (doc) {
    if (doc) {
        await mongoose.model("Comment").deleteMany({
            _id: {
                $in: doc.comments,
            },
        });
    }
});

module.exports = mongoose.model("Project", ProjectSchema);
