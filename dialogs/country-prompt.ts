import * as builder from 'botbuilder';
import countrydata from '../helpers/helper-countrydata';

let lib = new builder.Library('country-prompt');
let languages = require('country-data').languages;

lib.dialog('prompt', [
    (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        // Prompt the user for a country
        builder.Prompts.text(session, "drugs_country_prompt");
    },
    (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        if (results && results.response) {
            let searchCountry = countrydata.getCountryByName(results.response);
            if (searchCountry) {
                let result = {
                    country: searchCountry.name,
                    countryCode: searchCountry.alpha2
                };
                return session.endDialogWithResult({ response: result });
            }
        }

        session.send("drugs_default_country");
        return session.replaceDialog("prompt");
    }
]);

export function createLibrary(): builder.Library {
    return lib.clone();
}