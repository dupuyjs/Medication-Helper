import * as builder from 'botbuilder';

let locationDialog = require('botbuilder-location');
let lib = new builder.Library('places');

// Extends IEntity interface to support entity resolution.
declare interface IEntityEx extends builder.IEntity {
    resolution: any;
}

interface IStoredData {
    type: string
    location: string
}

lib.dialog('findplace', [
    (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let place: IStoredData;

        if (args && args.intent) {
            let intent = args.intent;
            let typeEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Type') as IEntityEx;
            let locationEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Location') as IEntityEx;

            place = session.dialogData.place = {
                type: typeEntity ? typeEntity.resolution.values[0] : undefined,
                location: locationEntity ? locationEntity.resolution : undefined,
            };
        }
        session.endDialog();
    }
]).triggerAction({ matches: 'Intent.FindPlace' });

export function createLibrary(): builder.Library {
    return lib.clone();
}