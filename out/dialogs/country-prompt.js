"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
const helper_countrydata_1 = require("../helpers/helper-countrydata");
let lib = new builder.Library('country-prompt');
let languages = require('country-data').languages;
lib.dialog('prompt', [
    (session, results, next) => {
        // Prompt the user for a country
        builder.Prompts.text(session, "drugs_country_prompt");
    },
    (session, results, next) => {
        if (results && results.response) {
            let searchCountry = helper_countrydata_1.default.getCountryByName(results.response);
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
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=country-prompt.js.map