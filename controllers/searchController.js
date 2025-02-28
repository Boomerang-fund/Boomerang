const Project = require("../models/project");
const categories = require("../utils/categories").categories;

// **1️⃣ Fetch all projects and embeddings**
async function fetchAllProjects() {
    const allProjects = await Project.find({}, "title embedding");
    return Object.fromEntries(
        allProjects.map(project => [project._id.toString(), project.embedding])
    );
}

// **2️⃣ Compute cosine similarity scores**
function computeSimilarityScores(keyword, wordVectors, allProjectsEmbeddingsDict) {
    const keywordEmbedding = getTitleEmbedding(keyword, wordVectors);
    
    return Object.entries(allProjectsEmbeddingsDict)
        .map(([projectId, embedding]) => ({
            id: projectId,
            similarity: cosineSimilarity(keywordEmbedding, embedding)
        }))
        .sort((a, b) => b.similarity - a.similarity) // Sort by highest similarity
        .map(item => item.id); // Extract sorted IDs
}

// **3️⃣ Fetch projects in the correct sorted order**
async function fetchAndSortProjects(sortedIds) {
    const projects = await Project.find({ _id: { $in: sortedIds } });

    // Convert to dictionary for fast lookup
    const projectsDict = Object.fromEntries(projects.map(project => [project._id.toString(), project]));
    
    // Return sorted projects in correct order
    return sortedIds.map(id => projectsDict[id]);
}

// **4️⃣ Transform projects for frontend display**
function transformProjects(sortedProjects, language) {
    return sortedProjects.map(project => ({
        _id: project._id,
        titleText: project.title.get(language) || project.title.get("en"),
        descriptionText: project.description.get(language) || project.description.get("en"),
        images: project.images,
        location: project.location,
        deadline: project.deadline,
        geometry: project.geometry
    }));
}

// **5️⃣ Prepare GeoJSON for the map**
function prepareGeoJsonProjects(transformedProjects) {
    return {
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
}

// **6️⃣ Main search function**
exports.searchProjects = async (req, res) => {
    try {
        const language = req.session.language || "en";
        const { keyword, location } = req.query;

        // **Step 1: Load projects and embeddings**
        const allProjectsEmbeddingsDict = await fetchAllProjects();

        // **Step 2: Compute similarity scores**
        const sortedIds = computeSimilarityScores(keyword, req.wordVectors, allProjectsEmbeddingsDict);

        // **Step 3: Fetch & Sort Projects**
        const sortedProjects = await fetchAndSortProjects(sortedIds);

        // **Step 4: Transform Projects for Display**
        const transformedProjects = transformProjects(sortedProjects, language);

        // **Step 5: Prepare GeoJSON**
        const geoJsonProjects = prepareGeoJsonProjects(transformedProjects);

        // **Step 6: Convert categories for dropdown**
        const categoryList = Object.keys(categories).map(key => ({ key, value: key }));

        // **Step 7: Render the search page**
        res.render("projects/search", {
            projects: transformedProjects,
            geoJsonProjects,
            location
        });
    } catch (error) {
        console.error("Search error:", error);
        res.status(500).send("Error searching projects.");
    }
};

// **7️⃣ Helper functions**
function getTitleEmbedding(title, wordVectors, vectorSize = 50, decimalPlaces = 4) {
    let words = title.toLowerCase().split(" ");
    
    let validVectors = words
        .map(word => wordVectors[word])
        .filter(vec => Array.isArray(vec) && vec.length === vectorSize && !vec.includes(NaN));

    if (validVectors.length === 0) {
        return Array(vectorSize).fill(0);
    }

    let summedVector = validVectors.reduce(
        (sum, vec) => sum.map((v, i) => v + vec[i]),
        Array(vectorSize).fill(0)
    );
    
    let avgVector = summedVector.map(v => v / validVectors.length);
    
    return avgVector.map(value => parseFloat(value.toFixed(decimalPlaces)));
}

function cosineSimilarity(vecA, vecB) {
    const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
    const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
    const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));

    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
}
