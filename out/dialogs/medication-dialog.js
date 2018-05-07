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
const cognitive_translator_1 = require("../services/cognitive-translator");
const medication_card_1 = require("../cards/medication-card");
const helper_countrydata_1 = require("../helpers/helper-countrydata");
let turndownService = require('turndown');
let languages = require('country-data').languages;
let lib = new builder.Library('medication');
/**
 * Information Dialog - Get Information (composition, usage, ...) about a medication
 */
lib.dialog('information', [
    (session, args, next) => __awaiter(this, void 0, void 0, function* () {
        let data = undefined;
        // Get the Medication entity
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name');
            let typeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Type');
            data = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                type: typeEntity ? typeEntity.resolution : undefined
            };
        }
        if (data && data.name) {
            if (next)
                return next();
        }
        else {
            session.send("drugs_help_tip_image");
            return builder.Prompts.text(session, "medication_prompt");
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }
        let data = session.dialogData.drug;
        if (data && data.name) {
            return session.beginDialog('medication-prompt:prompt', data.name);
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        // Formatting the response
        if (results && results.response) {
            let data = results.response;
            if (data.source == 'fr') {
                let drug = data.drug;
                // Brand Name
                session.send("**" + drug.denomination + "**");
                // Indications and Usage
                let indication_message = "Indications and Usage \n\n";
                let translatedIndications = yield cognitive_translator_1.default.getTranslationAsync(drug.indicationsTherapeutiques, 'fr', 'en');
                let turndown = new turndownService();
                if (translatedIndications) {
                    indication_message += turndown.turndown(translatedIndications);
                }
                session.send(indication_message);
                // Composition
                let composition_message = "Composition \n\n";
                for (var composition of drug.compositions) {
                    composition_message += `&nbsp;&nbsp;&nbsp;&nbsp;└ ${composition.designationElementPharmaceutique} \n\n`;
                    for (var substance of composition.substancesActives) {
                        let translatedSubstance = yield cognitive_translator_1.default.getTranslationAsync(substance.denominationSubstance, 'fr', 'en');
                        composition_message += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ ${translatedSubstance} with a dosage of ${substance.dosageSubstance} \n\n`;
                    }
                }
                session.send(composition_message);
            }
            if (data.source == 'us') {
                let drug = data.drug.results[0];
                // Brand Name
                session.send("**" + drug.openfda.brand_name[0] + "**");
                // Indications and Usage
                let indication_message = "Indications and Usage \n\n";
                indication_message += drug.indications_and_usage;
                session.send(indication_message);
                // Composition
                let composition_message = "Composition \n\n";
                if (drug.active_ingredient) {
                    for (let composition of drug.active_ingredient) {
                        composition_message += `&nbsp;&nbsp;&nbsp;&nbsp;└ ${composition} \n\n`;
                    }
                }
                session.send(composition_message);
            }
        }
        return session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Medications.GetInformation' });
/**
 * Translate Dialog - Convert substances into a specific language
 */
lib.dialog('translate', [
    (session, args, next) => __awaiter(this, void 0, void 0, function* () {
        let data = undefined;
        // Get Medication.Name, Language and Country entities
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name');
            let languageEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Language');
            let countryEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Country');
            data = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                language: languageEntity ? languageEntity.entity : undefined,
                languageCode: languageEntity ? languageEntity.resolution.values[0] : undefined,
                country: countryEntity ? countryEntity.entity : undefined,
                countryCode: undefined
            };
            // If we get a country, need to obtain the associated country code
            if (data.country) {
                let search = helper_countrydata_1.default.getCountryByName(data.country);
                if (search) {
                    session.dialogData.drug.countryCode = search.alpha2;
                }
            }
        }
        if (data && data.name) {
            if (next)
                return next();
        }
        else {
            // Prompt for a medication name
            return builder.Prompts.text(session, "medication_prompt");
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }
        let data = session.dialogData.drug;
        if (data && data.name) {
            // Prompt to validate the medication name (based on data source)
            return session.beginDialog('medication-prompt:prompt', data.name);
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        if (results && results.response) {
            session.dialogData.drug.drugdetails = results.response;
        }
        let data = session.dialogData.drug;
        if (!data.language && !data.country) {
            // Prompt for a country
            return session.beginDialog("country-prompt:prompt");
        }
        else {
            if (next)
                return next();
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        if (results && results.response) {
            session.dialogData.drug.country = results.response.country;
            session.dialogData.drug.countryCode = results.response.countryCode;
        }
        let data = session.dialogData.drug;
        // Ensure we have a languageCode
        let languageCode = undefined;
        if (data.languageCode) {
            languageCode = data.languageCode;
        }
        else if (data.countryCode) {
            let searchCountry = helper_countrydata_1.default.getCountryByCountryCode(data.countryCode);
            if (searchCountry) {
                let language = languages[searchCountry.languages[0]];
                if (language) {
                    languageCode = language.alpha2;
                }
            }
        }
        // Formatting the response
        if (data.drugdetails.source == 'fr') {
            let drug = data.drugdetails.drug;
            session.send("substances_message");
            for (var composition of drug.compositions) {
                for (var substance of composition.substancesActives) {
                    let translatedSubstance = yield cognitive_translator_1.default.getTranslationAsync(substance.denominationSubstance, 'fr', languageCode);
                    if (translatedSubstance) {
                        let card = medication_card_1.default.getMedicineCard(substance.denominationSubstance.toLowerCase(), translatedSubstance);
                        let message = new builder.Message(session).addAttachment(card);
                        session.send(message);
                    }
                }
            }
            if (drug.indicationsTherapeutiques) {
                let translatedIndications = yield cognitive_translator_1.default.getTranslationAsync(drug.indicationsTherapeutiques, 'fr', languageCode);
                let turndown = new turndownService();
                session.send(`Translated indications:\n\n` + turndown.turndown(translatedIndications));
            }
        }
        if (data.drugdetails.source == 'us') {
            let drug = data.drugdetails.drug.results[0];
            session.send("substances_message");
            if (drug.openfda) {
                for (let substance of drug.openfda.substance_name) {
                    let translatedSubstance = yield cognitive_translator_1.default.getTranslationAsync(substance, 'en', languageCode);
                    if (translatedSubstance) {
                        let card = medication_card_1.default.getMedicineCard(substance.toLowerCase(), translatedSubstance);
                        let message = new builder.Message(session).addAttachment(card);
                        session.send(message);
                    }
                }
            }
            if (drug.purpose) {
                let translatedIndications = yield cognitive_translator_1.default.getTranslationAsync(drug.purpose[0], 'en', languageCode);
                session.send(`Translated indications:\n\n` + translatedIndications);
            }
        }
        session.send("pharmacist_message");
        session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Medications.Translate' });
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=medication-dialog.js.map