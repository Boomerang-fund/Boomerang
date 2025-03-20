const Project = require("../models/project");
const Users = require("../models/user");
const ApiFetch = require("../models/apiFetch");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const { cloudinary } = require("../cloudinary");

const currencyToken = process.env.CURRENCY_TOKEN;
const { categories } = require("../utils/categories.js"); // Import the categories data

const {defaultLanguage, defaultCurrency } = require("../utils/constants");
const { computeProjectEmbedding } = require("../utils/embedding");

module.exports.index = async (req, res) => {
    const language = req.session.language || defaultLanguage;
    const user = await get_user(Users, req);

    // Fetch all projects
    const allProjects = await Project.find({});
    const projects = getDisplayTitleAndDescription(allProjects, language);

    // Fetch user's own projects if logged in
    let myProjects = [];
    if (req.user) {
        const userProjects = await Project.find({
            author: req.user._id,
            isDraft: false, // Exclude drafts
        });
        myProjects = getDisplayTitleAndDescription(userProjects, language);
    }

    // Convert projects to GeoJSON format
    try {
        // Filter out only published projects (not drafts)
        const publishedProjects = projects.filter(
            (project) => !project.isDraft
        );

        const geoJsonProjects = mapGeoJSON(publishedProjects);

        // Render the projects/index template
        res.render("projects/index", {
            geoJsonProjects,
            projects: publishedProjects,
            myProjects, // Pass user's own projects
        });
    } catch (err) {
        console.error("Error loading projects:", err);
        res.redirect("/");
    }
};

function getDisplayTitleAndDescription(projects, language) {
    return projects.map((project) => ({
        ...project.toObject(), // Convert Mongoose model to plain object
        displayTitle: project.title?.get(language) || project.title?.get(defaultLanguage) || "Untitled",
        displayDescription: project.description?.get(language) || project.description?.get(defaultLanguage) || "No description available",
    }));
}

function mapGeoJSON(projects) {
    const ret = {
            type: "FeatureCollection",
            features: projects.map((project) => ({
                type: "Feature",
                geometry: project.geometry || {
                    type: "Point",
                    coordinates: [0, 0], // Default coordinates
                },
                properties: {
                    title: project.displayTitle,
                    description: project.displayDescription,
                    popUpMarkup: `<a href="/projects/${project._id}">${project.displayTitle}</a>`,
                },
            })),
        };
    return ret;
}

module.exports.renderNewForm = async (req, res) => {
    const { draftId } = req.query; // ✅ Get draftId from query params
    let draft = null;

    if (draftId) {
        draft = await Project.findById(draftId);
        // if (!draft) {
        //     req.flash("error", "Draft not found.");
        //     return res.redirect("/projects/drafts");
        // }
    }

    res.render("projects/new", {
        draft, // ✅ Now, draft might contain a valid object
        categories: JSON.stringify(categories),
        mapBoxToken: mapBoxToken
    });
};


module.exports.showProject = async (req, res) => {
    try {
        const language = req.session.language || defaultLanguage;
        const currency = req.session.currency || defaultCurrency; 
        let project = getDisplayTitleAndDescription(
            [await Project.findById(req.params.id)
            .populate({
                path: "comments",
                populate: { path: "author" },
            })
            .populate("author")], 
        language); 
        project = project[0];
        
        if (!project) {
            req.flash("error", "Cannot find that project!");
            return res.redirect("/projects");
        }
        let apiFetch = await ApiFetch.findOne();
        const now = Date.now();
        const oneHour = 1000 * 60 * 60; // 1 hour in milliseconds

        let currencyData;

        if (!apiFetch || now - new Date(apiFetch.lastFetchTime).getTime() > 1000 * 60 * 60) {
            const response = await fetch(
               currencyToken
            );
            const freshData = await response.json();
            

            if (!apiFetch) {
                apiFetch = new ApiFetch({
                    lastFetchTime: new Date(),
                    currencyData: freshData,
                });
            } else {
                apiFetch.lastFetchTime = new Date();
                apiFetch.currencyData = freshData;
            }

            await apiFetch.save();
            currencyData = freshData;
        } else {
            currencyData = apiFetch.currencyData;
        }

        const userCurrency = req.user ? (await Users.findById(req.user._id)).currency : currency;

        // Pass the project, currencyData, and mapToken to the template
        res.render("projects/show", {
            project,
            currencyData,
            userCurrency,
            mapBoxToken, // Pass Mapbox token
        });

        
    } catch (error) {
        console.error("Error in showProject:", error);
        req.flash("error", "Something went wrong!");
        res.redirect("/projects");
    }
};

module.exports.getProjectsByCategory = async (req, res) => {
    const { category } = req.params;
    const language = req.session.language || defaultLanguage;
    try {
        // ChatGPT magic to find projects in the specified category by checking if queried category matches any key of the categories map in each projects
        // Don't ask how this works 
        const projects = await Project.find({
            $expr: {
                $gt: [
                    {
                        $size: {
                            $filter: {
                                input: { $objectToArray: "$categories" }, // Convert object to array
                                as: "cat",
                                cond: {
                                    $eq: [
                                        { $toLower: "$$cat.k" }, // Convert stored key to lowercase
                                        category.toLowerCase() // Convert user input to lowercase
                                    ]
                                }
                            }
                        }
                    },
                    0
                ]
            },
            isDraft: false
        });        
        // console.log("📌 Fetched Projects:", projects);
        
        const transformedProjects = getDisplayTitleAndDescription(projects,language);

        // Render category-specific projects page
        res.render("projects/category", {
            projects: transformedProjects,
            category,
        });
    } catch (error) {
        console.error("Error fetching projects by category:", error);
        res.status(500).send("Error loading projects for this category.");
    }
};




module.exports.renderNewForm = async (req, res) => {
    const { draftId } = req.query; // ✅ Get draftId from query params
    let draft = null;
    let nextStep = 1; // Default to Step 1

    if (draftId) {
        draft = await Project.findById(draftId);
        if (!draft) {
            req.flash("error", "Draft not found.");
            return res.redirect("/projects/drafts");
        }
       
        //Determine the step based on draft completion
        if (!draft.originalTitle || !draft.location) {
            nextStep = 1; // Stay on Step 1 if Title or Location is missing
        } else if (!draft.originalDescription || !(draft.images?.length > 0)) {
            nextStep = 2; // Go to Step 2 if Description or Images are missing
        } else if (!draft.fundingGoal || !draft.deadline) {
            nextStep = 3; // Go to Step 3 if Funding Goal or Deadline is missing
        } else if (!draft.categories || draft.categories.length === 0) {
            nextStep = 4; // Go to Step 4 if Categories are missing
        } else {
            nextStep = 4; // If everything is complete, stay on the last step
        }
        
        
    }

    res.render("projects/new", {
        draft,
        nextStep, // ✅ Pass nextStep to frontend
        categories: JSON.stringify(categories), // From utils
        savedCategories: draft ? JSON.stringify(draft.categories || {}) : "{}", // Load saved checkboxes
        mapBoxToken: mapBoxToken,
    });
};


module.exports.updateProject = async (req, res) => {
    const { id } = req.params;
    const { fromDrafts } = req.query; // Check if the user came from drafts
    const project = await Project.findByIdAndUpdate(id, {
        ...req.body.project,
        updatedAt: Date.now(),
    });

    if (req.body.deleteImages) {
        for (let filename of req.body.deleteImages) {
            await cloudinary.uploader.destroy(filename);
        }
        await project.updateOne({
            $pull: { images: { filename: { $in: req.body.deleteImages } } },
        });
    }

    req.flash("success", "Successfully updated project!");

    // Redirect back to drafts if user came from drafts
    if (fromDrafts) {
        return res.redirect("/projects/drafts");
    }

    res.redirect(`/projects/${project._id}`);
};

module.exports.deleteProject = async (req, res) => {
    const { id } = req.params;
    await Project.findByIdAndDelete(id);
    req.flash("success", "Successfully deleted project!");
    res.redirect("/projects");
};

module.exports.toggleSaveProject = async (req, res) => {
    const { id } = req.params;
    const keyword = req.query.keyword || ""; // Get keyword if provided
    const user = await Users.findById(req.user._id);

    const alreadySaved = user.savedProjects.includes(id);
    if (alreadySaved) {
        user.savedProjects.pull(id);
        await user.save();
        req.flash("success", "Project removed from your library.");
    } else {
        user.savedProjects.push(id);
        await user.save();
        req.flash("success", "Project saved to your library!");
    }

    // Check if the referer is the library page and redirect accordingly
    if (req.headers.referer && req.headers.referer.includes("/library")) {
        return res.redirect("/projects/library");
    } else if (keyword) {
        return res.redirect(`/search?keyword=${keyword}`);
    } else {
        return res.redirect("/projects");
    }
};

module.exports.viewLibrary = async (req, res) => {
    const user = await Users.findById(req.user._id).populate("savedProjects");
    res.render("projects/library", { projects: user.savedProjects });
};

//One controller function to handle both save draft and create project
module.exports.upsertProject = async (req, res) => {
    try {
        const { draftId } = req.body;
        const isDraft = req.url.includes("save-draft"); // Check if it's saving a draft or publishing
        let project = draftId ? await Project.findById(draftId) : new Project();

        if (!project && draftId) {
            req.flash("error", "Draft not found.");
            return res.redirect("/projects/drafts");
        }

        // Process uploaded images
        const uploadedImages = req.files?.map(file => ({
            url: file.path,
            filename: file.filename,
        })) || [];

        // Handle image deletions
        if (project && req.body.deleteImages?.length) {
            await Promise.all(req.body.deleteImages.map(async (filename) => {
                await cloudinary.uploader.destroy(filename);
            }));
            await project.updateOne({ $pull: { images: { filename: { $in: req.body.deleteImages } } } });
        }
    
        // Compute project embedding
        const embedding = await computeProjectEmbedding(isDraft ? "" : req.body.project.title.get("en") + " in " + req.body.project.location);
        
        // Prepare project data
        const projectData = {
            ...req.body.project,
            images: [...(project?.images || []), ...uploadedImages], 
            geometry: {
                type: "Point", 
                coordinates: JSON.parse(req.body.project.geometry)
            },
            categories: JSON.parse(req.body.project.categories),
            isDraft, // Dynamically set based on endpoint
            embedding,
            lastSavedAt: isDraft ? Date.now() : project.lastSavedAt, // Update timestamp if draft
            updatedAt: !isDraft ? Date.now() : project.updatedAt, // Only update if publishing
            createdAt: project.isNew ? Date.now() : project.createdAt, // Set creation date only for new projects
            author: project?.author || req.user._id,
        };

        console.log(projectData);

        // Apply updates and save
        project.set(projectData);
        await project.save();

        if (isDraft) {
            return res.status(200).json({ success: true, message: "Draft saved successfully!", draftId: project._id });
        } else {
            req.flash("success", "Successfully created a new project!");
            return res.json({ success: true, redirectUrl: `/projects/${project._id}` });
        }
    } catch (error) {
        console.error("❌ Error in upsertProject:", { message: error.message, stack: error.stack, body: req.body });

        if (req.url.includes("save-draft")) {
            return res.status(500).json({ success: false, message: "Failed to save draft." });
        } else {
            req.flash("error", "Failed to create or update the project. Please ensure all required fields are filled.");
            return res.redirect("/projects/new");
        }
    }
};



module.exports.deleteDraft = async (req, res) => {
    try {
        const { id } = req.params;
        await Project.findByIdAndDelete(id);
        req.flash("success", "Draft deleted successfully.");
        res.redirect("/projects/my-projects");
    } catch (error) {
        console.error("Failed to delete draft:", error);
        req.flash("error", "Failed to delete draft.");
        res.redirect("/projects/my-projects");
    }
};

async function get_user(Users, req) {
    let user = null;
    if (req.user) {
        user = await Users.findById(req.user._id);
    }
    return user;
}

