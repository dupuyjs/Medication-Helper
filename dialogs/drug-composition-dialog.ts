import * as builder from 'botbuilder';
import openmedicament from "../services/api-openmedicaments";

let lib = new builder.Library('drug');

// Extends IEntity interface to support entity resolution.
declare interface IEntityEx extends builder.IEntity {
    resolution: any;
}

lib.dialog('composition', [
    async (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let drug: any;

        if (args && args.intent) {
            let intent = args.intent;
            let medication: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Medication') as IEntityEx;

            drug = session.dialogData.drug = {
                name: medication ? medication.entity : undefined
            }
        }

        if (drug && drug.name) {
            let codes = await openmedicament.getMedicationCodeFromQueryAsync(drug.name);
            let info = await openmedicament.getMedicationFromIdAsync(codes[0].codeCIS);

            for(var composition of info.compositions) {
                for(var substance of composition.substancesActives) {
                    session.send(substance.denominationSubstance);
                }
            }
        }
    
        session.endDialog();
    }
]).triggerAction({ matches: 'Intent.Medication.GetComposition' });

export function createLibrary() : builder.Library {
    return lib.clone();
}