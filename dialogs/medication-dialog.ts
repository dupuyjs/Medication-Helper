import * as builder from 'botbuilder';
import openmedicament from "../services/api-openmedicaments";
import { Medication, MedicationCode } from "../services/api-openmedicaments";
import translator from "../services/cognitive-translator";
import medicationcard from "../cards/medication-card"

let turndownService = require('turndown');
let lib = new builder.Library('medication');

// Extends IEntity interface to support entity resolution.
declare interface IEntityEx extends builder.IEntity {
    resolution: any;
}

interface IInformationStoredData {
    name: string
    search: MedicationCode[]|undefined
}

interface ITranslateStoredData {
    name: string
    language: string
    languageCode: string
    search: MedicationCode[]|undefined
}

lib.dialog('information', [
    async (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let medication: IInformationStoredData|undefined = undefined;

        // Get the Medication entity
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name') as IEntityEx;

            medication = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                search : undefined
            }
        }

        if (medication && medication.name) {
            if (next) next();
        }
        else {
            builder.Prompts.text(session, "What is the medication name ?")
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let medication: IInformationStoredData = session.dialogData.drug;
        if (results && results.response) {
            medication = session.dialogData.drug = {
                name : results.response,
                search : undefined
            }
        }

        if (medication && medication.name) {
            try {
                let listOfMedication = await openmedicament.getMedicationCodeFromQueryAsync(medication.name);
                medicationPrompt(session, listOfMedication, next);
            } catch (error) {
                console.error(error);
            }
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let medication: IInformationStoredData = session.dialogData.drug;

        // Formatting the response
        if (results && results.response && results.response.entity && medication.search) {
            let response = results.response.entity;

            for (let item of medication.search) {
                if (item.denomination == response) {
                    let drug = await openmedicament.getMedicationFromIdAsync(item.codeCIS);

                    session.send(drug.denomination);

                    let translatedIndications = await translator.getTranslationAsync(drug.indicationsTherapeutiques, 'fr', 'en');
                    let turndown = new turndownService();

                    if (translatedIndications) session.send(turndown.turndown(translatedIndications));

                    for(var composition of drug.compositions) {
                        for(var substance of composition.substancesActives) {
                            let translatedSubstance = await translator.getTranslationAsync(substance.denominationSubstance, 'fr', 'en');
                            session.send(`${translatedSubstance} with a dosage of ${substance.dosageSubstance}`);
                        }
                    }
                }
            }
        }

        session.endDialog();
    }
]).triggerAction({ matches: 'Intent.Medications.GetInformation' });

lib.dialog('translate', [
    async (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let data: ITranslateStoredData|undefined = undefined;

        // Get the Medication entity
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name') as IEntityEx;
            let languageEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Language') as IEntityEx;

            data = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                language: languageEntity ? languageEntity.entity : undefined,
                languageCode: languageEntity ? languageEntity.resolution.values[0] : undefined,
                search : undefined
            }
        }

        if (data && data.name) {
            if (next) next();
        }
        else {
            builder.Prompts.text(session, "What is the medication name ?")
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        
        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }
        let data: ITranslateStoredData = session.dialogData.drug;

        if (data && data.name) {
            try {
                let listOfMedication = await openmedicament.getMedicationCodeFromQueryAsync(data.name);
                medicationPrompt(session, listOfMedication, next);
            } catch (error) {
                console.error(error);
            }
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let data: ITranslateStoredData = session.dialogData.drug;

        // Formatting the response
        if (results && results.response && results.response.entity && data.search) {
            let response = results.response.entity;

            for (let item of data.search) {
                if (item.denomination == response) {
                    let drug = await openmedicament.getMedicationFromIdAsync(item.codeCIS);

                    session.send("This medicine contains the following active substances:");

                    for(var composition of drug.compositions) {
                        for(var substance of composition.substancesActives) {
                            let translatedSubstance = await translator.getTranslationAsync(substance.denominationSubstance, 'fr', data.languageCode);
                            
                            if (translatedSubstance) {
                                let card = medicationcard.getMedicineCard(substance.denominationSubstance.toLowerCase(), translatedSubstance);

                                let message = new builder.Message(session).addAttachment(card);
                                session.send(message);
                            }
                        }
                    }
                }
            }
        }

        session.endDialog();
    }
]).triggerAction({ matches: 'Intent.Medications.Translate' });


function medicationPrompt(session: builder.Session, search: MedicationCode[], next?: (results?: builder.IDialogResult<any>) => void) {

    let medications = new Array<string>();

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

        session.send("Sorry. I didn't find any matching medication.")
        if (next) next();
    }
}

export function createLibrary(): builder.Library {
    return lib.clone();
}