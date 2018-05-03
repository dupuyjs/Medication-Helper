"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
const botbuilder_1 = require("botbuilder");
const cognitive_Vision_1 = require("../services/cognitive-Vision");
const cognitive_CustomVision_1 = require("../services/cognitive-CustomVision");
const helper_attachment_1 = require("../helpers/helper-attachment");
const cognitive_translator_1 = require("../services/cognitive-translator");
const helper_countrydata_1 = require("../helpers/helper-countrydata");
let lib = new builder.Library('image');
let image = undefined;
lib.dialog('detection', [
    (session, args, next) => __awaiter(this, void 0, void 0, function* () {
        session.send("Image received. Analysis in progress.");
        session.sendTyping();
        if (helper_attachment_1.default.hasImageAttachment(session.message)) {
            image = undefined;
            image = yield helper_attachment_1.default.getImageFromMessageAsync(session.message, session.connector);
            if (!image) {
                return session.endDialog("Not able to get the image you sent, sorry :(");
            }
            let isMedicineImage = yield cognitive_CustomVision_1.default.isMedicineImage(image);
            if (!isMedicineImage) {
                let caption = yield cognitive_Vision_1.default.getCaptionFromImageAsync(image);
                return session.endDialog(`This image is not medicine package. It seems ${caption}.`);
            }
            return session.beginDialog("language-dialog");
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        let ocrResult = undefined;
        if (image) {
            if (results.response == "unknown") {
                ocrResult = yield cognitive_Vision_1.default.getTextFromImageAsync(image);
            }
            else {
                ocrResult = yield cognitive_Vision_1.default.getTextFromImageAsync(image, results.response.languageCode);
            }
        }
        if (!ocrResult) {
            return session.endDialog("Sorry, I didn’t recognize this, please try with another one.");
        }
        let language;
        let ocrText;
        let fullText;
        let translationText;
        if (ocrResult.language) {
            language = yield cognitive_translator_1.default.getLanguageNameAsync(ocrResult.language);
            ocrText = yield cognitive_Vision_1.default.getTextFromOcrResult(ocrResult);
        }
        if (language === undefined || ocrText === undefined || ocrText.join('') == '') {
            return session.endDialog("Sorry, I didn’t recognize this, please try with another one.");
        }
        session.send(`We recognized a medicine package with ${language} language.`);
        if (ocrText) {
            fullText = ocrText.join('');
            translationText = yield cognitive_translator_1.default.getTranslationAsync(fullText, ocrResult.language, "en");
        }
        session.send(`Text description in ${language}: ${fullText}.`);
        session.send(`Translation in English : ${translationText}.`);
        return session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Upload.Image' });
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
lib.dialog('language-dialog', [
    (session, results, next) => {
        // Prompt the user for a language
        builder.Prompts.text(session, "image_language_prompt");
    },
    (session, results, next) => {
        let userAnswer = results.response;
        let pattern = new RegExp(/^unknown/i);
        let matches = userAnswer.match(pattern);
        if (matches) {
            return session.endDialogWithResult({ response: "unknown" });
        }
        if (results && results.response) {
            let searchLanguage = helper_countrydata_1.default.getVisionLanguageByName(results.response);
            if (searchLanguage && searchLanguage.length == 1) {
                let result = {
                    language: searchLanguage[0].name,
                    languageCode: searchLanguage[0].code
                };
                return session.endDialogWithResult({ response: result });
            }
            else if (searchLanguage && searchLanguage.length > 1) {
                let choices = new Array();
                searchLanguage.forEach(element => {
                    choices.push(element.name);
                });
                return builder.Prompts.choice(session, "Please select an option:", choices, { listStyle: botbuilder_1.ListStyle.button });
            }
        }
        session.send("image_default_language");
        return session.replaceDialog("language-dialog");
    },
    (session, results, next) => {
        let searchLanguage = helper_countrydata_1.default.getVisionLanguageByName(results.response.entity);
        let result = {
            language: searchLanguage[0].name,
            languageCode: searchLanguage[0].code
        };
        return session.endDialogWithResult({ response: results });
    }
]);
//# sourceMappingURL=imagedetection-dialog.js.map