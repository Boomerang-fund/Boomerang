

const fs = require("fs");
const path = require("path");

// **1️⃣ Load GloVe Embeddings**
async function loadGloveModel(filePath) {
    console.log("⏳ Loading GloVe Model...");
    const data = fs.readFileSync(filePath, "utf8").split("\n");

    let wordVectors = {};
    for (let line of data) {
        let parts = line.split(" ");
        let word = parts[0]; // The word itself
        let vector = parts.slice(1).map(Number); // Convert embedding to numbers
        wordVectors[word] = vector;
    }

    console.log("✅ GloVe Model Loaded! Words:", Object.keys(wordVectors).length);
    return wordVectors;
}

// **2️⃣ Fetch Project Titles from MongoDB**
async function fetchProjectTitles() {
    const allProjects = await Project.find({}, "title");
    return allProjects.map(p => ({
        id: p._id,
        title: p.title.get("en") // Extract English titles
    }));
}

// **3️⃣ Convert Project Titles to GloVe Embeddings**
function getTitleEmbedding(title, wordVectors, vectorSize = 50, decimalPlaces = 4) {
    let words = title.toLowerCase().split(" ");
    let validVectors = words
        .map(word => wordVectors[word])
        .filter(vec => Array.isArray(vec) && vec.length === vectorSize && !vec.includes(NaN));

    if (validVectors.length === 0) {
        return Array(vectorSize).fill(0); // Return zero vector if no valid words
    }

    // Compute the average
    let summedVector = validVectors.reduce((sum, vec) => sum.map((v, i) => v + vec[i]), Array(vectorSize).fill(0));
    let avgVector = summedVector.map(v => v / validVectors.length);

    // **Truncate the values**
    return avgVector.flat().map(value => parseFloat(value.toFixed(decimalPlaces)));
}



// **4️⃣ Generate & Print Embeddings**
async function generateEmbeddings(wordVectors) {
    const projects = await fetchProjectTitles();

    console.log("\n🔍 Generated Embeddings for Projects:");
    for (let project of projects) {
        const embedding = getTitleEmbedding(project.title, wordVectors);
        console.log(`📌 Project: ${project.title}`);
        console.log(`🔢 Embedding:`, embedding, "\n");
    }
}

// Load GloVe & Generate Embeddings
const glovePath = path.join(__dirname, "glove.6B.50d.txt");

require("dotenv").config();
const mongoose = require("mongoose");
const Project = require("./models/project");

mongoose.connect(process.env.DB_URL, {}).then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB Connection Error:", err));

async function updateProjectsWithEmbeddings(wordVectors) {
    const projects = await Project.find({}, "title"); // Fetch titles only

    for (let project of projects) {
        const englishTitle = project.title?.get("en");

        if (!englishTitle) {
            console.log(`⚠️ Skipping project (No English title): ${project._id}`);
            continue;
        }

        // Generate embedding
        const embedding = getTitleEmbedding(englishTitle, wordVectors);
        console.log("Embedding shape:", embedding.length, embedding[0]?.length);
        // Update MongoDB with the new embedding field
        await Project.updateOne(
            { _id: project._id },
            { $set: { embedding } },
            { upsert: true }
        );

        console.log(`✅ Updated project: "${englishTitle}"`);
    }

    console.log("🎯 All projects updated with embeddings!");
    mongoose.connection.close();
}

// **Run the update process**
loadGloveModel(glovePath).then(async (model) => {
    wordVectors = model;
    await updateProjectsWithEmbeddings(wordVectors);
});
