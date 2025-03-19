const mongoose = require("mongoose");
const cities = require("./cities");
const Project = require("../models/project");
const projects = require("./startups");
const fs = require("fs");
const path = require("path");
const { categories: predefinedCategories } = require("../utils/categories");





async function main() {
    try {
        await mongoose.connect("mongodb+srv://pyboomerang:Yde0txCGfN7kN5zc@boomerang.dbvmq.mongodb.net/", {});
        console.log("✅ MongoDB Connected");

        // **3️⃣ Load GloVe Model Before Seeding**
        

        // **4️⃣ Run Seed Function with Loaded Word Vectors**
        await seedDB(0);

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
       
        const randomCity = cities[Math.floor(Math.random() * cities.length)];
        const fundingGoal = Math.floor(Math.random() * 50) * 1000 + 1000;
        const titleEn = generateTitleVariation(randomProject.title["en"]);
        const mappedCategories = new Map();

        if (randomProject.categories && typeof randomProject.categories === "object") {
            for (const [category, keywords] of Object.entries(randomProject.categories)) {
                mappedCategories.set(category, Array.isArray(keywords) ? keywords : []);
            }
        } else {
            console.error("❌ Invalid categories format:", randomProject.categories);
        }
        // **Ensure Embedding Uses the Loaded Word Vectors**
        

        const project = new Project({
            author: "67bfd9ac621c9f89b80c39c5",
            location: `${randomCity.city}, ${randomCity.state}`,
            title: { en: titleEn, th: randomProject.title["th"] },
            originalTitle: randomProject.title["en"],
            description: randomProject.description,
            originalDescription: randomProject.description["en"],
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
            embedding: [],
            categories: mappedCategories
        });

        await project.save();
    }
};

// **5️⃣ Run the Database Seed Process**
main();

// **Utility Functions**


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
