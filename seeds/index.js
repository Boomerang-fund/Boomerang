const mongoose = require("mongoose");
const cities = require("./cities");
const Project = require("../models/project");
const projects = require("./startups");
const fs = require("fs");
const path = require("path");

// **1️⃣ Load GloVe Model Properly**
async function loadGloveModel(filePath) {
    console.log("⏳ Loading GloVe Model...");

    if (!fs.existsSync(filePath)) {
        console.error("❌ GloVe file not found at:", filePath);
        process.exit(1); // Stop execution
    }

    const data = fs.readFileSync(filePath, "utf8").split("\n");
    let wordVectors = {};

    for (let line of data) {
        let parts = line.trim().split(" "); // Ensure no empty lines
        if (parts.length < 51) continue; // Each line should have 50 numbers + 1 word

        let word = parts[0]; // Extract word
        let vector = parts.slice(1).map(Number); // Convert rest to numbers
        wordVectors[word] = vector;
    }

    console.log("✅ GloVe Model Loaded! Words:", Object.keys(wordVectors).length);
    return wordVectors;
}


const glovePath = path.join(__dirname, "../glove.6B.50d.txt");

// **2️⃣ Connect to MongoDB First**
async function main() {
    try {
        await mongoose.connect("mongodb+srv://pyboomerang:Yde0txCGfN7kN5zc@boomerang.dbvmq.mongodb.net/", {});
        console.log("✅ MongoDB Connected");

        // **3️⃣ Load GloVe Model Before Seeding**
        const wordVectors = await loadGloveModel(glovePath);

        // **4️⃣ Run Seed Function with Loaded Word Vectors**
        await seedDB(wordVectors);

        mongoose.connection.close();
        console.log("✅ Database seeding complete, connection closed.");
    } catch (err) {
        console.error("❌ MongoDB Connection Error:", err);
    }
}

const seedDB = async (wordVectors) => {
    await Project.deleteMany({});
    for (let i = 0; i < 100; i++) {
        const randomProject = projects[Math.floor(Math.random() * projects.length)];
        console.log(randomProject.categories);
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        const fundingGoal = Math.floor(Math.random() * 50) * 1000 + 1000;
        const titleEn = generateTitleVariation(randomProject.title["en"]);

        // **Ensure Embedding Uses the Loaded Word Vectors**
        const embedding = getFinalEmbedding(titleEn, `${randomCity.city}, ${randomCity.state}`, wordVectors);

        const project = new Project({
            author: "67bfd9ac621c9f89b80c39c5",
            location: `${randomCity.city}, ${randomCity.state}`,
            title: { en: titleEn, th: randomProject.title["th"] },
            titleText: randomProject.title["th"],
            description: randomProject.description,
            descriptionText: randomProject.description["th"],
            currency: "THB",
            fundingGoal: fundingGoal,
            geometry: {
                type: "Point",
                coordinates: [randomCity.longitude, randomCity.latitude],
            },
            deadline: new Date("2030-12-31"),
            createdAt: new Date("2024-10-01"),
            updatedAt: new Date("2024-10-15"),
            images: [
                {
                    url: "https://res.cloudinary.com/dei5hbjfg/image/upload/v1732073743/Boomerang/qxc1jfz18ana6m3d0fbr.png",
                    filename: "Boomerang/ujp5lxrxohzvkutf5oos",
                },
                {
                    url: "https://res.cloudinary.com/dei5hbjfg/image/upload/v1732073743/Boomerang/lgtvfra0krsrwggt3pkk.png",
                    filename: "Boomerang/yxnzsyuugorktvqfp7ln",
                },
            ],
            status: "active",
            embedding: embedding,
            categories: randomProject.categories
        });

        await project.save();
    }
};

// **5️⃣ Run the Database Seed Process**
main();

// **Utility Functions**
function getTitleEmbedding(title, wordVectors, vectorSize = 50, decimalPlaces = 4) {
    let words = title.toLowerCase().split(" ");
    let validVectors = words
        .map(word => wordVectors[word])
        .filter(vec => Array.isArray(vec) && vec.length === vectorSize);

    if (validVectors.length === 0) return Array(vectorSize).fill(0);

    let summedVector = validVectors.reduce((sum, vec) => sum.map((v, i) => v + vec[i]), Array(vectorSize).fill(0));
    let avgVector = summedVector.map(v => v / validVectors.length);

    return avgVector.map(value => parseFloat(value.toFixed(decimalPlaces)));
}



function getFinalEmbedding(title, location, wordVectors, lambda = 0.8) {
    let titleVector = getTitleEmbedding(title, wordVectors);
    

    return titleVector
}

function generateTitleVariation(title) {
    const prefixes = [""];
    const suffixes = [""];
    const variations = [
        title, // Original
        `${title} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`, // Add suffix
        `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${title}`, // Add prefix
        `${prefixes[Math.floor(Math.random() * prefixes.length)]} ${title} ${suffixes[Math.floor(Math.random() * suffixes.length)]}`, // Prefix + Suffix
    ];
    return variations[Math.floor(Math.random() * variations.length)];
}
