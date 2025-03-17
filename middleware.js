const { projectSchema, commentSchema } = require("./schemas.js");
const ExpressError = require("./utils/ExpressError");
const Project = require("./models/project");
const Comment = require("./models/comment");
const { translate_text } = require("./utils/translation");

module.exports.isLoggedIn = (req, res, next) => {
    if (!req.isAuthenticated()) {
        req.session.returnTo = req.originalUrl; // add this line
        req.flash("error", "You must be signed in first!");
        return res.redirect("/login");
    }
    next();
};

module.exports.storeReturnTo = (req, res, next) => {
    if (req.session.returnTo) {
        res.locals.returnTo = req.session.returnTo;
    }
    next();
};

module.exports.validateAndFixProject = async (req, res, next) => {
    const { error } = projectSchema.validate(req.body);
    console.log(req.body);

    let fixedErrors = false;
    if (error) {
        for (const detail of error.details) {
            // Checking and fixing project.title errors
            if (detail.path.length === 2 && detail.path[0] === "project" && detail.path[1] === "title") {
                if (req.body.project.titleText) {
                    req.body.project.title = await translate_text(req.body.project.titleText);
                    fixedErrors = true;
                    console.log("TITLE TRANSLATED");
                }
            }

            // Checking and fixing project.description errros
            if (detail.path.length === 2 && detail.path[0] === "project" && detail.path[1] == "description") {
                if (req.body.project.descriptionText) {
                    req.body.project.description = await translate_text(req.body.project.descriptionText);
                    fixedErrors = true;
                    console.log("DESCRIPTION TRANSLATED");
                }
            }
        }

        if (fixedErrors) {
            return module.exports.validateAndFixProject(req, res, next);
        }

        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};

module.exports.isAuthor = async (req, res, next) => {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project.author.equals(req.user._id)) {
        req.flash("error", "You do not have permission!");
        res.redirect(`/projects/${id}`);
    }
    next();
};

module.exports.isCommentAuthor = async (req, res, next) => {
    const { id, commentId } = req.params;
    const comment = await Comment.findById(commentId);
    if (!comment.author.equals(req.user._id)) {
        req.flash("error", "You do not have permission to do that!");
        return res.redirect(`/projects/${id}`);
    }
    next();
};

module.exports.validateComment = (req, res, next) => {
    const { error } = commentSchema.validate(req.body);
    if (error) {
        const msg = error.details.map((el) => el.message).join(",");
        throw new ExpressError(msg, 400);
    } else {
        next();
    }
};
