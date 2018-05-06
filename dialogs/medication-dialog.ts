import * as builder from 'botbuilder';
import openmedicament, { Medication, MedicationCode } from "../services/api-openmedicaments";
import openfda, { Result } from "../services/api-openfda";
import translator from "../services/cognitive-translator";
import medicationcard from "../cards/medication-card"

let turndownService = require('turndown');
let lib = new builder.Library('medication');

// Extends IEntity interface to support entity resolution.
declare interface IEntityEx extends builder.IEntity {
    resolution: any;
}

interface IInformationStoredData {
    name: string,
    type: string
}

interface ITranslateStoredData {
    name: string
    language: string
    languageCode: string
}

/**
 * information dialog - get information (composition, usage, ...) about a medication
 */
lib.dialog('information', [
    async (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let data: IInformationStoredData | undefined = undefined;

        // Get the Medication entity
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name') as IEntityEx;
            let typeEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Type') as IEntityEx;

            data = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                type: typeEntity ? typeEntity.resolution : undefined
            }
        }

        if (data && data.name) {
            if (next) return next();
        }
        else {
            return builder.Prompts.text(session, "medication_prompt")
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }

        let data: IInformationStoredData = session.dialogData.drug;

        if (data && data.name) {
            session.beginDialog('prompt:medication-prompt', data.name);
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        // Formatting the response
        if (results && results.response) {
            let data = results.response;

            if (data.source == 'fr') {
                let drug: Medication = data.drug;

                // Brand Name
                session.send("**" + drug.denomination + "**");

                // Indications and Usage
                let indication_message = "Indications and Usage \n\n";
                let translatedIndications = await translator.getTranslationAsync(drug.indicationsTherapeutiques, 'fr', 'en');
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
                        let translatedSubstance = await translator.getTranslationAsync(substance.denominationSubstance, 'fr', 'en');
                        composition_message += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;└ ${translatedSubstance} with a dosage of ${substance.dosageSubstance} \n\n`;
                    }
                }
                session.send(composition_message);
            }

            if (data.source == 'us') {
                let drug: Result = data.drug.results[0];

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
    }
]).triggerAction({ matches: 'Intent.Medications.GetInformation' });

/**
 * translate dialog - convert substances into a specific language
 */
lib.dialog('translate', [
    async (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let data: ITranslateStoredData | undefined = undefined;

        // Get the Medication entity
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name') as IEntityEx;
            let languageEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Language') as IEntityEx;

            data = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                language: languageEntity ? languageEntity.entity : undefined,
                languageCode: languageEntity ? languageEntity.resolution.values[0] : undefined
            }
        }

        if (data && data.name) {
            if (next) return next();
        }
        else {
            return builder.Prompts.text(session, "medication_prompt")
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }

        let data: IInformationStoredData = session.dialogData.drug;

        if (data && data.name) {
            session.beginDialog('prompt:medication-prompt', data.name);
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let data: ITranslateStoredData = session.dialogData.drug;

        // Formatting the response
        if (results && results.response) {
            let data = results.response;

            if (data.source == 'fr') {
                let drug: Medication = data.drug;

                session.send("substances_message");

                for (var composition of drug.compositions) {
                    for (var substance of composition.substancesActives) {
                        let translatedSubstance = await translator.getTranslationAsync(substance.denominationSubstance, 'fr', data.languageCode);

                        if (translatedSubstance) {
                            let card = medicationcard.getMedicineCard(substance.denominationSubstance.toLowerCase(), translatedSubstance);

                            let message = new builder.Message(session).addAttachment(card);
                            session.send(message);
                        }
                    }
                }
            }

            if (data.source == 'us') {
                let drug: Result = data.drug.results[0];

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
    }
]).triggerAction({ matches: 'Intent.Medications.Translate' });


export function createLibrary(): builder.Library {
    return lib.clone();
}