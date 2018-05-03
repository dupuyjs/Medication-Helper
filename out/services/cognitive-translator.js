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
const node_fetch_1 = require("node-fetch");
const xmljs = require("xml-js");
let baseUrl = 'https://api.microsofttranslator.com/v2/Http.svc';
/**
 * Translator Text API Client SDK (http://docs.microsofttranslator.com/text-translate.html)
 * @class TranslatorService
 */
class TranslatorService {
    /**
     * Translates a text string from one language to another.
     * @method getTranslationAsync
     * @param {string} text
     * Required. A string representing the text to translate. The size of the text must not exceed 10000 characters.
     * @param {string} from
     * Optional. A string representing the language code of the translation text. For example, en for English.
     * @param {string} to
     * Optional. A string representing the language code to translate the text into.
     * @returns {string}
     * A string representing the translated text.
     */
    getTranslationAsync(text, from, to = "en") {
        return __awaiter(this, void 0, void 0, function* () {
            let translatorApiKey = process.env.COGNITIVE_TRANSLATOR_API_KEY;
            if (!translatorApiKey) {
                throw new Error('translator text api key is undefined');
            }
            if (!text) {
                throw new Error('text argument is empty or undefined');
            }
            let translation = undefined;
            let encodedText = encodeURIComponent(text);
            let url = `${baseUrl}/Translate?text=${encodedText}`;
            if (from) {
                url += `&from=${from}`;
            }
            if (to) {
                url += `&to=${to}`;
            }
            let response = yield node_fetch_1.default(url, {
                method: 'GET',
                headers: {
                    'Ocp-Apim-Subscription-Key': translatorApiKey,
                }
            })
                .catch(error => console.error(error));
            if (response) {
                let xmlcontent = yield response.text();
                if (xmlcontent) {
                    let json = xmljs.xml2js(xmlcontent, { compact: true, ignoreAttributes: true });
                    if (json && json.string && json.string._text) {
                        translation = json.string._text;
                    }
                }
            }
            return translation;
        });
    }
    /**
     * Retrieves friendly names for the languages passed in as the parameter languageCode,
     * and localized using the passed locale language.
     * @method getLanguageNameAsync
     * @param {string} languageCode
     * @param {string} locale
     * @returns {string}
     * A string representing the translated text.
     */
    getLanguageNameAsync(languageCode, locale) {
        return __awaiter(this, void 0, void 0, function* () {
            let code = encodeURIComponent(languageCode);
            let culture = locale ? locale : 'en';
            let translatorApiKey = process.env.COGNITIVE_TRANSLATOR_API_KEY;
            // Check if environment variables are correct
            if (translatorApiKey == undefined) {
                console.log("Cognitive Services - Translation - Url or Api Key undefined.");
                return undefined;
            }
            let query = `${baseUrl}/GetLanguageNames?locale=${culture}`;
            let response = yield node_fetch_1.default(query, {
                method: 'POST',
                headers: {
                    'Ocp-Apim-Subscription-Key': translatorApiKey,
                    'Content-Type': 'text/xml'
                },
                body: `<ArrayOfstring xmlns:i="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://schemas.microsoft.com/2003/10/Serialization/Arrays">
                        <string>${languageCode}</string>
                    </ArrayOfstring>`
            });
            if (response && response.status && response.status >= 200 && response.status <= 299) {
                let text = yield response.text();
                if (!text) {
                    return undefined;
                }
                let jsonText = xmljs.xml2js(text, { compact: true, ignoreAttributes: true });
                if (jsonText && jsonText.ArrayOfstring && jsonText.ArrayOfstring.string && jsonText.ArrayOfstring.string._text) {
                    return jsonText.ArrayOfstring.string._text;
                }
            }
            return undefined;
        });
    }
}
exports.TranslatorService = TranslatorService;
let translatorService = new TranslatorService();
exports.default = translatorService;
//# sourceMappingURL=cognitive-translator.js.map