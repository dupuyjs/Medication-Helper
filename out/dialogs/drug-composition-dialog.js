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
let lib = new builder.Library('drug');
lib.dialog('composition', [
    (session, args, next) => __awaiter(this, void 0, void 0, function* () {
        let drug;
        if (args && args.intent) {
            let intent = args.intent;
            let medication = builder.EntityRecognizer.findEntity(intent.entities, 'Medication');
            drug = session.dialogData.drug = {
                name: medication ? medication.entity : undefined
            };
        }
        if (drug && drug.name) {
            let codes = yield api_openmedicaments_1.default.getMedicationCodeFromQueryAsync(drug.name);
            let info = yield api_openmedicaments_1.default.getMedicationFromIdAsync(codes[0].codeCIS);
            for (var composition of info.compositions) {
                for (var substance of composition.substancesActives) {
                    session.send(substance.denominationSubstance);
                }
            }
        }
        session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Medication.GetComposition' });
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=drug-composition-dialog.js.map