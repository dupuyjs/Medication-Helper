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
const botbuilder_1 = require("botbuilder");
const api_bingspatialdata_1 = require("../services/api-bingspatialdata");
let locationDialog = require('botbuilder-location');
let lib = new builder.Library('places');
lib.dialog('findplace', [
    (session, args, next) => {
        let place;
        let heathplace = false;
        if (args && args.intent) {
            let intent = args.intent;
            let typeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Type');
            let locationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Location');
            place = session.dialogData.place = {
                type: typeEntity ? typeEntity.resolution.values[0] : undefined,
                location: locationEntity ? locationEntity.resolution : undefined,
            };
            // We want to manage only medical places
            heathplace = place.type == 'hospital' || place.type == 'pharmacy';
        }
        if (!heathplace) {
            builder.Prompts.choice(session, "choice_prompt", "hospital|pharmacy", { listStyle: botbuilder_1.ListStyle.button });
        }
        else {
            if (next)
                next();
        }
    },
    (session, results, next) => {
        let place = session.dialogData.place;
        if (results && results.response) {
            place.type = session.dialogData.place.type = results.response.entity;
        }
        // Trigger prompt to get the user location
        let options = {
            prompt: "Where are you located ?",
            useNativeControl: true,
            reverseGeocode: true,
            skipConfirmationAsk: true,
            skipFavorites: true,
            requiredFields: locationDialog.LocationRequiredFields.locality
        };
        try {
            locationDialog.getLocation(session, options);
        }
        catch (error) {
            console.error("locationDialog.getLocation failed. " + error);
        }
    },
    (session, results, next) => __awaiter(this, void 0, void 0, function* () {
        let place = session.dialogData.place;
        if (results && results.response) {
            place.location = session.dialogData.place.location = results.response;
        }
        try {
            let data = yield api_bingspatialdata_1.default.getSpatialDataFromAreaAsync(place.location.geo.latitude, place.location.geo.longitude, api_bingspatialdata_1.EntityType.Pharmacy);
            let message = formatCarouselMessage(session, place, data);
            session.send(message);
        }
        catch (error) {
            console.error("spatialData.getSpatialDataFromAreaAsync. " + error);
        }
        session.endDialog();
    })
]).triggerAction({ matches: 'Intent.FindPlace' });
function formatCarouselMessage(session, place, data) {
    let cards = new Array();
    let userLatitude = place.location.geo.latitude;
    let userLongitude = place.location.geo.longitude;
    let bingUrl = 'https://bing.com';
    let message = new builder.Message().text("Oups. No item found. It seems I cannot help you at the moment :(.");
    // Ensure we returns only a maximum of five answers.
    if (data && data.d && data.d.results && data.d.results.length > 0) {
        for (let item of data.d.results) {
            if (userLatitude && userLongitude && item.Latitude && item.Longitude) {
                // Bing maps Uri scheme (https://msdn.microsoft.com/en-us/library/dn217138.aspx)
                bingUrl = `https://bing.com/maps/default.aspx?rtp=pos.${userLatitude}_${userLongitude}~pos.${item.Latitude}_${item.Longitude}_${item.DisplayName}&rtop=0~1~0`;
            }
            cards.push(new builder.ThumbnailCard(session)
                .title(item.DisplayName)
                .subtitle(`${item.AddressLine}, ${item.Locality}`)
                .buttons([
                builder.CardAction.openUrl(session, bingUrl, "get directions")
            ]));
        }
        session.send(data.d.__copyright);
        message = new builder.Message(session)
            .text("We found the following places for you.")
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(cards);
    }
    return message;
}
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=findplace-dialog.js.map