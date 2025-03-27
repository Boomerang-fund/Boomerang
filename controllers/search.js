const Project = require("../models/project");
const categories = require("../utils/categories").categories;
const { computeProjectEmbedding } = require("../utils/embedding");

exports.searchProjects = async (req, res) => {
    const language = req.session.language || "th";
    const { query } = req.query;

    if (!query) {
        return res.status(400).send("Please enter a search term.");
    }

    const queryEmbedding = await computeProjectEmbedding(query);

    const allProjects = await Project.find({ isDraft: false });

    const sortedProjects = allProjects
        .map((project) => ({
            project,
            similarity: cosineSimilarity(queryEmbedding, project.embedding),
        }))
        .filter((item) => item.similarity > 0.3)
        .sort((a, b) => b.similarity - a.similarity)
        .map((item) => item.project);

    const transformedProjects = sortedProjects.map((project) => ({
        _id: project._id,
        titleText: project.title.get(language) || project.title.get("th"),
        descriptionText: project.description?.get(language) || project.description?.get("th") || "",
        images: project.images,
        location: project.location,
        deadline: project.deadline,
        geometry: project.geometry,
    }));

    const geoJsonProjects = {
        type: "FeatureCollection",
        features: transformedProjects
            .filter((project) => project.geometry && project.geometry.type === "Point" && Array.isArray(project.geometry.coordinates) && project.geometry.coordinates.length === 2)
            .map((project) => ({
                type: "Feature",
                geometry: project.geometry,
                properties: {
                    title: project.titleText,
                    description: project.descriptionText,
                    popUpMarkup: `<a href="/projects/${project._id}">${project.titleText}</a>`,
                },
            })),
    };

    res.render("projects/search", {
        projects: transformedProjects,
        geoJsonProjects,
        query,
    });
};

function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    const cosineSimilarity = magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
    
    return cosineSimilarity;
}
