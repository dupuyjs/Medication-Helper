import fetch from 'node-fetch';
import * as xmljs from 'xml-js'

let baseUrl = 'https://api.microsofttranslator.com/v2/Http.svc'

/**
 * Translator Text API Client SDK (http://docs.microsofttranslator.com/text-translate.html)
 * @class TranslatorService
 */
export class TranslatorService {

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
    public async getTranslationAsync(text: string, from?: string, to: string = "en"): Promise<string | undefined> {

        let translatorApiKey = process.env.COGNITIVE_TRANSLATOR_API_KEY;

        if (!translatorApiKey) {
            throw new Error('translator text api key is undefined')
        }

        if (!text) {
            throw new Error('text argument is empty or undefined')
        }

        let translation = undefined
        let encodedText = encodeURIComponent(text);
        let url = `${baseUrl}/Translate?text=${encodedText}`;

        if (from) {
            url += `&from=${from}`;
        }

        if (to) {
            url += `&to=${to}`
        }

        let response = await fetch(url,
            {
                method: 'GET',
                headers:
                    {
                        'Ocp-Apim-Subscription-Key': translatorApiKey,
                    }
            })
            .catch(error => console.error(error))

        if (response) {
            let xmlcontent = await response.text()

            if (xmlcontent) {
                let json = xmljs.xml2js(xmlcontent, { compact: true, ignoreAttributes: true });

                if (json && json.string && json.string._text) {
                    translation = json.string._text;
                }
            }
        }

        return translation;
    }
}

let translatorService = new TranslatorService();
export default translatorService;