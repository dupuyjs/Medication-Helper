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
let turndownService = require('turndown');
let lib = new builder.Library('medication');
/**
 * information dialog - get information (composition, usage, ...) about a medication
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
            return builder.Prompts.text(session, "medication_prompt");
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }
        let data = session.dialogData.drug;
        if (data && data.name) {
            session.beginDialog('prompt:medication-prompt', data.name);
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
 * translate dialog - convert substances into a specific language
 */
lib.dialog('translate', [
    (session, args, next) => __awaiter(this, void 0, void 0, function* () {
        let data = undefined;
        // Get the Medication entity
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name');
            let languageEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Language');
            data = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                language: languageEntity ? languageEntity.entity : undefined,
                languageCode: languageEntity ? languageEntity.resolution.values[0] : undefined
            };
        }
        if (data && data.name) {
            if (next)
                return next();
        }
        else {
            return builder.Prompts.text(session, "medication_prompt");
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }
        let data = session.dialogData.drug;
        if (data && data.name) {
            session.beginDialog('prompt:medication-prompt', data.name);
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        let data = session.dialogData.drug;
        // Formatting the response
        if (results && results.response) {
            let data = results.response;
            if (data.source == 'fr') {
                let drug = data.drug;
                session.send("substances_message");
                for (var composition of drug.compositions) {
                    for (var substance of composition.substancesActives) {
                        let translatedSubstance = yield cognitive_translator_1.default.getTranslationAsync(substance.denominationSubstance, 'fr', data.languageCode);
                        if (translatedSubstance) {
                            let card = medication_card_1.default.getMedicineCard(substance.denominationSubstance.toLowerCase(), translatedSubstance);
                            let message = new builder.Message(session).addAttachment(card);
                            session.send(message);
                        }
                    }
                }
            }
            if (data.source == 'us') {
                let drug = data.drug.results[0];
                session.send("substances_message");
                if (drug.active_ingredient) {
                    for (let composition of drug.active_ingredient) {
                    }
                }
                // for (var composition of drug.compositions) {
                //     for (var substance of composition.substancesActives) {
                //         let translatedSubstance = await translator.getTranslationAsync(substance.denominationSubstance, 'fr', data.languageCode);
                //         if (translatedSubstance) {
                //             let card = medicationcard.getMedicineCard(substance.denominationSubstance.toLowerCase(), translatedSubstance);
                //             let message = new builder.Message(session).addAttachment(card);
                //             session.send(message);
                //         }
                //     }
                // }
            }
        }
        session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Medications.Translate' });
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=medication-dialog.js.map