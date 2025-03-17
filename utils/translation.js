const { Translate } = require("@google-cloud/translate").v2;
const translate = new Translate({ key: process.env.GOOGLE_CLOUD_TRANSLATION_KEY });
const { availableLanguages } = require("../utils/constants");

async function translate_text(text) {
    let textMap = new Map();

    for (let language of availableLanguages) {
        if (textMap.has(language)) {continue;}

        const [ translation, metadata ] = await translate.translate(text, language);
        console.log(language + " -> " + translation + " " + metadata);
        
        if (translation) {
            textMap.set(language, translation);
        } else {
            textMap.set(language, text);
        }

        if (metadata && metadata.detectedSourceLanguage && !textMap.has(metadata.detectedSourceLanguage)) {
            textMap.set(metadata.detectedSourceLanguage, text);
        }
    }

    return textMap;
}

async function translate_project(req, res, next) {
    // Ensure that title and description maps are created
    if (!req.body.project.title && req.body.project.titleText && typeof req.body.project.titleText === "string") {
        req.body.project.title = await translate_text(req.body.project.titleText, availableLanguages);
    }
    if (!req.body.project.description && req.body.project.descriptionText && typeof req.body.project.descriptionText === "string") {
        req.body.project.description = await translate_text(req.body.project.descriptionText, availableLanguages);
    }

    console.log(req.body.project.title); // TODO: REMOVE
    console.log(req.body.project.description); // TODO: REMOVE
    console.log(); // TODO: REMOVE

    next();
}

module.exports = { translate_text, translate_project };