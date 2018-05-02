"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
let locationDialog = require('botbuilder-location');
let lib = new builder.Library('places');
lib.dialog('findplace', [
    (session, args, next) => {
        let place;
        if (args && args.intent) {
            let intent = args.intent;
            let typeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Type');
            let locationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Location');
            place = session.dialogData.place = {
                type: typeEntity ? typeEntity.resolution.values[0] : undefined,
                location: locationEntity ? locationEntity.resolution : undefined,
            };
        }
        session.endDialog();
    }
]).triggerAction({ matches: 'Intent.FindPlace' });
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=findplace-dialog.js.map