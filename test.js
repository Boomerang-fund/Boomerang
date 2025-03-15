const mongoose = require("mongoose");
const Project = require("./models/project");
const { pipeline } = require("@xenova/transformers");
require("dotenv").config();

let embedder;

// **1️⃣ Load Transformer Model**
async function loadTransformerModel() {
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
}

// **2️⃣ Compute Project Embedding**
async function computeProjectEmbedding(title) {
    if (!title || title.trim().length === 0) return Array(384).fill(0);

    const rawEmbedding = await embedder(title, { pooling: "mean", normalize: true });
    return Object.values(rawEmbedding.data).map(num => parseFloat(num));
}

// **3️⃣ Update MongoDB with SBERT Embeddings**
async function updateProjectsWithEmbeddings() {
    const projects = await Project.find({}, "title");

    for (let project of projects) {
        const englishTitle = project.title?.get("en");
        if (!englishTitle) continue;

        const embedding = await computeProjectEmbedding(englishTitle);

        await Project.updateOne(
            { _id: project._id },
            { $set: { embedding } },
            { upsert: true }
        );
        console.log(`Updated: ${englishTitle}`)
    }
    
    mongoose.connection.close();
}

// **4️⃣ Run the Process**
mongoose.connect(process.env.DB_URL, {});

async function main() {
    await loadTransformerModel();
    await updateProjectsWithEmbeddings();
}

main();
