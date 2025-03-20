const { Translate } = require("@google-cloud/translate").v2;
const translate = new Translate({ key: process.env.GOOGLE_CLOUD_TRANSLATION_KEY });
const { availableLanguages } = require("../utils/constants");

async function translate_text(text) {
    let textMap = new Map();

    if (text.includes("__TEST__")) {
        for (let language of availableLanguages) {
            textMap.set(language, text);
        }
        return textMap;
    }

    for (let language of availableLanguages) {
        if (textMap.has(language)) continue;
        const [translation, metadata] = await translate.translate(text, language);
        if (translation) {
            textMap.set(language, translation);
        } else {
            textMap.set(language, text);
        }
        if (metadata?.detectedSourceLanguage && !textMap.has(metadata.detectedSourceLanguage)) {
            textMap.set(metadata.detectedSourceLanguage, text);
        }
    }

    return textMap;
}

async function translate_project(req, res, next) {
    
    // Ensure title and description are properly handled
    if (!req.body.project.originalTitle || req.body.project.originalTitle.trim() === "") {
        req.body.project.title = await translate_text("Title not found");
    } else if (!req.body.project.title) {
        req.body.project.title = await translate_text(req.body.project.originalTitle);
    }

    if (!req.body.project.originalDescription || req.body.project.originalDescription.trim() === "") {
        req.body.project.description = await translate_text("Description not found");
    } else if (!req.body.project.description) {
        req.body.project.description = await translate_text(req.body.project.originalDescription);
    }
    
    next();
}

module.exports = { translate_text, translate_project };
