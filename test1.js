const mongoose = require("mongoose");
require("dotenv").config();
const Project = require("./models/project");

(async () => {
    await mongoose.connect(process.env.DB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    });

    console.log("✅ MongoDB Connected");

    // **Remove the `keywords` field from all documents**
    await Project.updateMany({}, { $unset: { keywords: "" } });

    console.log("✅ Removed `keywords` field from all projects!");

    mongoose.connection.close();
})();
