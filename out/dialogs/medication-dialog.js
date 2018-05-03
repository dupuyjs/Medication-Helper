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
let lib = new builder.Library('medication');
lib.dialog('composition', [
    (session, args, next) => __awaiter(this, void 0, void 0, function* () {
        let medication = undefined;
        // Get the Medication entity
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Medication');
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
                    for (var composition of drug.compositions) {
                        for (var substance of composition.substancesActives) {
                            session.send(`${substance.denominationSubstance} with a dosage of ${substance.dosageSubstance}`);
                        }
                    }
                }
            }
        }
        session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Medication.GetComposition' });
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