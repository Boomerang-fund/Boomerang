const Project = require("../models/project");
const categories = require("../utils/categories").categories;

let embedder;

async function loadTransformerModel() {
    if (!embedder) {
        const { pipeline } = await import("@xenova/transformers");
        embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    }
}

// **2️⃣ Compute Embedding for Query**
async function computeTitleEmbedding(title) {
    if (!title || title.trim().length === 0) return Array(384).fill(0); // 384-dimensional zero vector

    const rawEmbedding = await embedder(title, { pooling: "mean", normalize: true });

    // Convert from object to array
    return Object.values(rawEmbedding.data).map(num => parseFloat(num));
}

// **3️⃣ Main Search Function**
exports.searchProjects = async (req, res) => {
    await loadTransformerModel(); // Ensure model is loaded

    const language = req.session.language || "en";
    const { query } = req.query;

    if (!query) {
        return res.status(400).send("Please enter a search term.");
    }

    // **Step 1: Compute Query Embedding**
    const queryEmbedding = await computeTitleEmbedding(query);
    

    // **Step 2: Retrieve Projects from DB**
    const allProjects = await Project.find({isDraft: false});
    
    
    
    // **Step 3: Compute Similarities**
    const sortedProjects = allProjects
         // Ensure valid embedding
        .map(project => ({
            project,
            similarity: cosineSimilarity(queryEmbedding, project.embedding),
        }))

        .sort((a, b) => b.similarity - a.similarity) // Sort by highest similarity
        .map(item => item.project);

    // **Step 4: Transform for Display**
    const transformedProjects = sortedProjects.map(project => ({
        _id: project._id,
        titleText: project.title.get(language) || project.title.get("en"),
        descriptionText: project.description?.get(language) || project.description?.get("en") || "", // 🔥 Fix applied here
        images: project.images,
        location: project.location,
        deadline: project.deadline,
        geometry: project.geometry
    }));
    

    // **Step 5: Prepare GeoJSON**
    const geoJsonProjects = {
        type: "FeatureCollection",
        features: transformedProjects
            .filter(
                project =>
                    project.geometry &&
                    project.geometry.type === "Point" &&
                    Array.isArray(project.geometry.coordinates) &&
                    project.geometry.coordinates.length === 2
            )
            .map(project => ({
                type: "Feature",
                geometry: project.geometry,
                properties: {
                    title: project.titleText,
                    description: project.descriptionText,
                    popUpMarkup: `<a href="/projects/${project._id}">${project.titleText}</a>`,
                },
            }))
    };

    // **Step 6: Render the search page**
    res.render("projects/search", {
        projects: transformedProjects,
        geoJsonProjects,
        query
    });
};

// **4️⃣ Cosine Similarity Function**
function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}
