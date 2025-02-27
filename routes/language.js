const express = require('express');
const router = express.Router();
const languageController = require('../controllers/language'); // Adjust the path as needed

// POST route to handle language selection
router.post('/set-language', languageController.setLanguage);

module.exports = router;