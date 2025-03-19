const { pipeline } = require("@xenova/transformers");

let embedder = null; // Store the model in a global variable

// ✅ Load the model at startup
async function loadTransformerModel() {
    console.log("🚀 Loading Transformer Model...");
    embedder = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    console.log("✅ Transformer Model Loaded!");
}

// ✅ Compute the embedding for a given title
async function computeProjectEmbedding(title) {
    if (!embedder) {
        console.warn("⚠️ Model not loaded yet. Returning zero vector.");
        return Array(384).fill(0); // Return empty embedding
    }
    if (!title || title.trim().length === 0) return Array(384).fill(0);

    const rawEmbedding = await embedder(title, { pooling: "mean", normalize: true });
    return Object.values(rawEmbedding.data).map(num => parseFloat(num));
}

// ✅ Call `loadTransformerModel()` when the server starts
loadTransformerModel();

module.exports = { computeProjectEmbedding };