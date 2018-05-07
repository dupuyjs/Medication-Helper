import * as builder from 'botbuilder';
import openmedicament, { Medication, MedicationCode } from "../services/api-openmedicaments";
import openfda, { Result } from "../services/api-openfda";
import translator from "../services/cognitive-translator";
import medicationcard from "../cards/medication-card";
import countrydata from '../helpers/helper-countrydata';

let turndownService = require('turndown');
let languages = require('country-data').languages;

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
    language?: string
    languageCode?: string
    country?: string,
    countryCode?: string,
    drugdetails?: any
}

/**
 * Information Dialog - Get Information (composition, usage, ...) about a medication
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
            session.send("drugs_help_tip_image");
            return builder.Prompts.text(session, "medication_prompt")
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }

        let data: IInformationStoredData = session.dialogData.drug;

        if (data && data.name) {
            return session.beginDialog('medication-prompt:prompt', data.name);
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
 * Translate Dialog - Convert substances into a specific language
 */
lib.dialog('translate', [
    async (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let data: ITranslateStoredData | undefined = undefined;

        // Get Medication.Name, Language and Country entities
        if (args && args.intent) {
            let intent = args.intent;
            let medicationEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Medication.Name') as IEntityEx;
            let languageEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Language') as IEntityEx;
            let countryEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Country') as IEntityEx;

            data = session.dialogData.drug = {
                name: medicationEntity ? medicationEntity.entity : undefined,
                language: languageEntity ? languageEntity.entity : undefined,
                languageCode: languageEntity ? languageEntity.resolution.values[0] : undefined,
                country: countryEntity ? countryEntity.entity : undefined,
                countryCode: undefined
            }

            // If we get a country, need to obtain the associated country code
            if (data.country) {
                let search = countrydata.getCountryByName(data.country);

                if (search) {
                    session.dialogData.drug.countryCode = search.alpha2;
                }
            }
        }

        if (data && data.name) {
            if (next) return next();
        }
        else {
            // Prompt for a medication name
            return builder.Prompts.text(session, "medication_prompt")
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        if (results && results.response) {
            session.dialogData.drug.name = results.response;
        }

        let data: ITranslateStoredData = session.dialogData.drug;

        if (data && data.name) {
            // Prompt to validate the medication name (based on data source)
            return session.beginDialog('medication-prompt:prompt', data.name);
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        if (results && results.response) {
            session.dialogData.drug.drugdetails = results.response;
        }

        let data: ITranslateStoredData = session.dialogData.drug;

        if (!data.language && !data.country) {
            // Prompt for a country
            return session.beginDialog("country-prompt:prompt");
        } else {
            if (next) return next();
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        if (results && results.response) {
            session.dialogData.drug.country = results.response.country;
            session.dialogData.drug.countryCode = results.response.countryCode;
        }

        let data: ITranslateStoredData = session.dialogData.drug;

        // Ensure we have a languageCode
        let languageCode = undefined;
        if (data.languageCode) {
            languageCode = data.languageCode;
        }
        else if (data.countryCode) {
            let searchCountry = countrydata.getCountryByCountryCode(data.countryCode);
            if (searchCountry) {
                let language = languages[searchCountry.languages[0]];
                if (language) {
                    languageCode = language.alpha2;
                }
            }
        }

        // Formatting the response
        if (data.drugdetails.source == 'fr') {
            let drug: Medication = data.drugdetails.drug;

            session.send("substances_message");

            for (var composition of drug.compositions) {
                for (var substance of composition.substancesActives) {
                    let translatedSubstance = await translator.getTranslationAsync(substance.denominationSubstance, 'fr', languageCode);

                    if (translatedSubstance) {
                        let card = medicationcard.getMedicineCard(substance.denominationSubstance.toLowerCase(), translatedSubstance);

                        let message = new builder.Message(session).addAttachment(card);
                        session.send(message);
                    }
                }
            }

            if (drug.indicationsTherapeutiques) {
                let translatedIndications = await translator.getTranslationAsync(drug.indicationsTherapeutiques, 'fr', languageCode);
                let turndown = new turndownService();
                session.send(`Translated indications:\n\n` + turndown.turndown(translatedIndications));
            }
        }

        if (data.drugdetails.source == 'us') {
            let drug: Result = data.drugdetails.drug.results[0];

            session.send("substances_message");

            if (drug.openfda) {
                for (let substance of drug.openfda.substance_name) {
                    let translatedSubstance = await translator.getTranslationAsync(substance, 'en', languageCode);

                    if (translatedSubstance) {
                        let card = medicationcard.getMedicineCard(substance.toLowerCase(), translatedSubstance);

                        let message = new builder.Message(session).addAttachment(card);
                        session.send(message);
                    }
                }
            }

            if (drug.purpose) {
                let translatedIndications = await translator.getTranslationAsync(drug.purpose[0], 'en', languageCode);
                session.send(`Translated indications:\n\n` + translatedIndications);
            }
        }

        session.send("pharmacist_message");

        session.endDialog();
    }
]).triggerAction({ matches: 'Intent.Medications.Translate' });


export function createLibrary(): builder.Library {
    return lib.clone();
}