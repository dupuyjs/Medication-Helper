import * as builder from 'botbuilder';
import openmedicament from "../services/api-openmedicaments";
import openfda from "../services/api-openfda";

let lib = new builder.Library('medication-prompt');

interface ISearchStoredData {
    source: string
    search: any
};

interface IFdaSearch {
    brand_name: string,
    id: string,
    set_id: string,
    version: string
}

const MAX_RESULTS = 10;

/**
 * medication-prompt dialog - search into openfda and openmedicament data source
 */
lib.dialog('prompt', [
    async (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        let query = args;
        let medications = new Array<string>();

        try {

            // Verification in Open Medicaments data source (France)
            let frSearch = await openmedicament.getMedicationCodeFromQueryAsync(query);
            if (frSearch && frSearch.length > 0) {
                if (frSearch.length > MAX_RESULTS) {
                    frSearch = frSearch.slice(0, MAX_RESULTS);
                }

                // Save the current search in dialogData state
                let data: ISearchStoredData = {
                    source: 'fr',
                    search: frSearch
                }

                session.dialogData.search = data;

                for (let item of frSearch) {
                    medications.push(item.denomination);
                }

                return builder.Prompts.choice(session, "medication_prompt", medications);
            }

            // Verification in Open FDA data source (US)
            let usSearch = await openfda.getMedicationFromQueryAsync(query);
            if (usSearch && usSearch.results && usSearch.results.length > 0) {
                if (usSearch.results.length > MAX_RESULTS) {
                    usSearch.results = usSearch.results.slice(0, MAX_RESULTS);
                }

                // Save the current search in dialogData state
                let search = new Array<IFdaSearch>();

                for (let item of usSearch.results) {
                    medications.push(item.openfda.brand_name[0]);
                    search.push({
                        brand_name: item.openfda.brand_name[0],
                        id: item.id,
                        set_id: item.set_id,
                        version: item.version
                    });
                }

                // Save the current search in dialogData state
                let data: ISearchStoredData = {
                    source: 'us',
                    search: search
                }

                session.dialogData.search = data;

                return builder.Prompts.choice(session, "medication_prompt", medications);
            }

            session.send("notfound_message")
            if (next) return session.endDialog();

        } catch (error) {
            console.error(error);
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {

        let data: ISearchStoredData = session.dialogData.search;
        let drug = undefined;

        if (results && results.response && results.response.entity && data.source) {
            let response = results.response.entity;

            if (data.source == 'fr') {
                for (let item of data.search) {
                    if (item.denomination == response) {
                        drug = await openmedicament.getMedicationFromIdAsync(item.codeCIS);
                    }
                }
            }

            if (data.source == 'us') {
                for (let item of data.search) {
                    if (item.brand_name == response) {
                        drug = await openfda.getMedicationFromIdAsync(item.id);
                    }
                }
            }
        }

        let result : builder.IDialogResult<any> = { 
            response : {
                source: data.source,
                drug: drug
        }};

        return session.endDialogWithResult(result);
    }
]);

export function createLibrary(): builder.Library {
    return lib.clone();
}