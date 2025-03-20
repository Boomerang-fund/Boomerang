// routes/search.js
const express = require("express");
const router = express.Router();
const { searchProjects } = require("../controllers/search");

router.get("/search", searchProjects);

module.exports = router;
