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
const api_openmedicaments_1 = require("../services/api-openmedicaments");
const cognitive_translator_1 = require("../services/cognitive-translator");
const medication_card_1 = require("../cards/medication-card");
let lib = new builder.Library('medication');
lib.dialog('information', [
    (session, args, next) => __awaiter(this, void 0, void 0, function* () {
        let medication = undefined;
        // Get the Medication entity
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name');
            medication = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                search: undefined
            };
        }
        if (medication && medication.name) {
            if (next)
                next();
        }
        else {
            builder.Prompts.text(session, "What is the medication name ?");
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        let medication = session.dialogData.drug;
        if (results && results.response) {
            medication = session.dialogData.drug = {
                name: results.response,
                search: undefined
            };
        }
        if (medication && medication.name) {
            try {
                let listOfMedication = yield api_openmedicaments_1.default.getMedicationCodeFromQueryAsync(medication.name);
                medicationPrompt(session, listOfMedication, next);
            }
            catch (error) {
                console.error(error);
            }
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        let medication = session.dialogData.drug;
        // Formatting the response
        if (results && results.response && results.response.entity && medication.search) {
            let response = results.response.entity;
            for (let item of medication.search) {
                if (item.denomination == response) {
                    let drug = yield api_openmedicaments_1.default.getMedicationFromIdAsync(item.codeCIS);
                    session.send(drug.denomination);
                    let translatedIndications = yield cognitive_translator_1.default.getTranslationAsync(drug.indicationsTherapeutiques, 'fr', 'en');
                    if (translatedIndications)
                        session.send(translatedIndications);
                    for (var composition of drug.compositions) {
                        for (var substance of composition.substancesActives) {
                            let translatedSubstance = yield cognitive_translator_1.default.getTranslationAsync(substance.denominationSubstance, 'fr', 'en');
                            session.send(`${translatedSubstance} with a dosage of ${substance.dosageSubstance}`);
                        }
                    }
                }
            }
        }
        session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Medications.GetInformation' });
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
                languageCode: languageEntity ? languageEntity.resolution.values[0] : undefined,
                search: undefined
            };
        }
        if (data && data.name) {
            if (next)
                next();
        }
        else {
            builder.Prompts.text(session, "What is the medication name ?");
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }
        let data = session.dialogData.drug;
        if (data && data.name) {
            try {
                let listOfMedication = yield api_openmedicaments_1.default.getMedicationCodeFromQueryAsync(data.name);
                medicationPrompt(session, listOfMedication, next);
            }
            catch (error) {
                console.error(error);
            }
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        let data = session.dialogData.drug;
        // Formatting the response
        if (results && results.response && results.response.entity && data.search) {
            let response = results.response.entity;
            for (let item of data.search) {
                if (item.denomination == response) {
                    let drug = yield api_openmedicaments_1.default.getMedicationFromIdAsync(item.codeCIS);
                    session.send("This medicine contains the following active substances:");
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
            }
        }
        session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Medications.Translate' });
function medicationPrompt(session, search, next) {
    let medications = new Array();
    if (search && search.length > 0) {
        // Limit the result to the first ten answers
        if (search.length > 10) {
            search = search.slice(0, 10);
        }
        // Save the current search in dialogData state
        session.dialogData.drug.search = search;
        for (let item of search) {
            medications.push(item.denomination);
        }
        builder.Prompts.choice(session, "Please confirm the name of the medication:", medications);
    }
    else {
        session.send("Sorry. I didn't find any matching medication.");
        if (next)
            next();
    }
}
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=medication-dialog.js.map