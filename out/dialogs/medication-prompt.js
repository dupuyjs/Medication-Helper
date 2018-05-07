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
const api_openfda_1 = require("../services/api-openfda");
let lib = new builder.Library('medication-prompt');
;
const MAX_RESULTS = 10;
/**
 * medication-prompt dialog - search into openfda and openmedicament data source
 */
lib.dialog('prompt', [
    (session, args, next) => __awaiter(this, void 0, void 0, function* () {
        let query = args;
        let medications = new Array();
        try {
            // Verification in Open Medicaments data source (France)
            let frSearch = yield api_openmedicaments_1.default.getMedicationCodeFromQueryAsync(query);
            if (frSearch && frSearch.length > 0) {
                if (frSearch.length > MAX_RESULTS) {
                    frSearch = frSearch.slice(0, MAX_RESULTS);
                }
                // Save the current search in dialogData state
                let data = {
                    source: 'fr',
                    search: frSearch
                };
                session.dialogData.search = data;
                for (let item of frSearch) {
                    medications.push(item.denomination);
                }
                return builder.Prompts.choice(session, "medication_prompt", medications);
            }
            // Verification in Open FDA data source (US)
            let usSearch = yield api_openfda_1.default.getMedicationFromQueryAsync(query);
            if (usSearch && usSearch.results && usSearch.results.length > 0) {
                if (usSearch.results.length > MAX_RESULTS) {
                    usSearch.results = usSearch.results.slice(0, MAX_RESULTS);
                }
                // Save the current search in dialogData state
                let search = new Array();
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
                let data = {
                    source: 'us',
                    search: search
                };
                session.dialogData.search = data;
                return builder.Prompts.choice(session, "medication_prompt", medications);
            }
            session.send("notfound_message");
            if (next)
                return session.endDialog();
        }
        catch (error) {
            console.error(error);
        }
    }),
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        let data = session.dialogData.search;
        let drug = undefined;
        if (results && results.response && results.response.entity && data.source) {
            let response = results.response.entity;
            if (data.source == 'fr') {
                for (let item of data.search) {
                    if (item.denomination == response) {
                        drug = yield api_openmedicaments_1.default.getMedicationFromIdAsync(item.codeCIS);
                    }
                }
            }
            if (data.source == 'us') {
                for (let item of data.search) {
                    if (item.brand_name == response) {
                        drug = yield api_openfda_1.default.getMedicationFromIdAsync(item.id);
                    }
                }
            }
        }
        let result = {
            response: {
                source: data.source,
                drug: drug
            }
        };
        return session.endDialogWithResult(result);
    })
]);
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=medication-prompt.js.map