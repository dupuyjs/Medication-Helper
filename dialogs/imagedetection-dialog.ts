import * as builder from 'botbuilder';
import {ListStyle} from 'botbuilder';
import vision from '../services/cognitive-Vision';
import custom from '../services/cognitive-CustomVision';
import attachment from "../helpers/helper-attachment";
import translator from "../services/cognitive-translator";
import countrydata from '../helpers/helper-countrydata';

let lib = new builder.Library('image');
let image: Buffer | undefined = undefined;

lib.dialog('detection', [
    async (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        session.send("Image received. Analysis in progress.");

        session.sendTyping();

        if (attachment.hasImageAttachment(session.message)) {

            image = undefined;
            image = await attachment.getImageFromMessageAsync(session.message, session.connector);

            if (!image) {
                return session.endDialog("Not able to get the image you sent, sorry :(");
            }

            let isMedicineImage = await custom.isMedicineImage(image);

            if (!isMedicineImage) {
                let caption = await vision.getCaptionFromImageAsync(image);
                return session.endDialog(`This image is not medicine package. It seems ${caption}.`);
            }

            return session.beginDialog("language-dialog");
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        let ocrResult = undefined;

        if (image) {
            if (results.response == "unknown") {
                ocrResult = await vision.getTextFromImageAsync(image);
            } else {
                ocrResult = await vision.getTextFromImageAsync(image, results.response.languageCode);
            }
        }

        if (!ocrResult) {
            return session.endDialog("Sorry, I didn’t recognize this, please try with another one.");
        }

        let language: string | undefined;
        let ocrText: string[] | undefined;
        let fullText: string | undefined;
        let translationText: string | undefined;

        if (ocrResult.language) {
            language = await translator.getLanguageNameAsync(ocrResult.language);
            ocrText = await vision.getTextFromOcrResult(ocrResult);
        }

        if (language === undefined || ocrText === undefined || ocrText.join('') == '') {
            return session.endDialog("Sorry, I didn’t recognize this, please try with another one.");
        }

        session.send(`We recognized a medicine package with ${language} language.`)

        if (ocrText) {
            fullText = ocrText.join('');
            translationText = await translator.getTranslationAsync(fullText, ocrResult.language, "en");
        }

        session.send(`Text description in ${language}: ${fullText}.`);
        session.send(`Translation in English : ${translationText}.`)

        return session.endDialog();

    }]).triggerAction({ matches: 'Intent.Upload.Image' });

export function createLibrary() {
    return lib.clone();
}

lib.dialog('language-dialog', [
    (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        // Prompt the user for a language
        builder.Prompts.text(session, "image_language_prompt");
    },
    (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        let userAnswer : string = results.response;
        let pattern = new RegExp(/^unknown/i );
        let matches = userAnswer.match(pattern);

        if (matches) {
            return session.endDialogWithResult({ response: "unknown" })
        }

        if (results && results.response) {
            let searchLanguage = countrydata.getVisionLanguageByName(results.response);

            if (searchLanguage && searchLanguage.length == 1) {
                let result = {
                    language: searchLanguage[0].name,
                    languageCode: searchLanguage[0].code
                };

                return session.endDialogWithResult({ response: result });
            } else if (searchLanguage && searchLanguage.length > 1) {

                let choices = new Array<string>();
                searchLanguage.forEach(element => {
                    choices.push(element.name);
                });

                return builder.Prompts.choice(session, "Please select an option:", choices, {listStyle : ListStyle.button})
            }
        }

        session.send("image_default_language");
        return session.replaceDialog("language-dialog");
    },
    (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        
        let searchLanguage = countrydata.getVisionLanguageByName(results.response.entity);

        let result = {
            language: searchLanguage[0].name,
            languageCode: searchLanguage[0].code
        };

        return session.endDialogWithResult({ response: results });
    }
]);