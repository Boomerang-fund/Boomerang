let embedder = null;

async function loadTransformerModel() {
    const { pipeline } = await import("@xenova/transformers");
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    console.log("Transformer Model Loaded!");
}

async function computeProjectEmbedding(title) {
    if (!embedder) {
        await loadTransformerModel();
    }

    if (!title || title.trim().length === 0) {
        return Array(384).fill(0);
    }

    const rawEmbedding = await embedder(title, { pooling: "mean", normalize: true });
    return Object.values(rawEmbedding.data).map((num) => parseFloat(num));
}

module.exports = { computeProjectEmbedding };
