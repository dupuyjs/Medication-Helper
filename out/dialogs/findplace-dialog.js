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
// Dialog triggered on Intent.FindPlace (ex. Find a Pharmacy in Paris)
lib.dialog('findplace', [
    (session, args, next) => {
        let place;
        let heathplace = false;
        if (args && args.intent) {
            let intent = args.intent;
            // Get Place.Type and Place.Location entities
            let typeEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Type');
            let locationEntity = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Location');
            place = session.dialogData.place = {
                type: typeEntity ? typeEntity.resolution.values[0] : undefined,
                location: locationEntity ? locationEntity.entity : undefined,
            };
            // We want to manage only medical places
            heathplace = place.type == 'hospital' || place.type == 'pharmacy';
        }
        if (!heathplace) {
            builder.Prompts.choice(session, "choice_prompt", "hospital|pharmacy", { listStyle: botbuilder_1.ListStyle.button });
        }
        else {
            if (next)
                return next();
        }
    },
    (session, results, next) => {
        let place = session.dialogData.place;
        if (results && results.response) {
            place.type = session.dialogData.place.type = results.response.entity;
        }
        // Check if we already have a location
        if (place.location) {
            if (next)
                return next();
        }
        let location_text = session.localizer.gettext(session.preferredLocale(), "location_prompt", "places");
        // Trigger prompt to get the user location
        let options = {
            prompt: location_text,
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
        let type = (place.type == 'pharmacy') ? api_bingspatialdata_1.EntityType.Pharmacy : api_bingspatialdata_1.EntityType.Hospital;
        // We have a location and type of location - we can perform the search
        try {
            let data = undefined;
            if (place.location.geo && place.location.geo.latitude && place.location.geo.longitude) {
                data = yield api_bingspatialdata_1.default.getSpatialDataFromLatitudeLongitudeAsync(place.location.geo.latitude, place.location.geo.longitude, type);
            }
            else {
                data = yield api_bingspatialdata_1.default.getSpatialDataFromAddressAsync(place.location, type);
            }
            let message = formatCarouselMessage(session, place, data);
            session.send(message);
        }
        catch (error) {
            console.error("spatialData.getSpatialDataFromAreaAsync. " + error);
        }
        return session.endDialog();
    })
]).triggerAction({ matches: 'Intent.Places.FindLocation' });
/**
 * Format points of interest to a carousel message
 * @method formatCarouselMessage
 * @param {builder.Session} session
 * @param {IStoredData} place
 * @param {SpatialData} data
 */
function formatCarouselMessage(session, place, data) {
    let cards = new Array();
    let isLatitudeLongitude;
    if (place.location.geo && place.location.geo.latitude && place.location.geo.longitude) {
        isLatitudeLongitude = true;
    }
    else {
        isLatitudeLongitude = false;
    }
    let bingUrl = 'https://bing.com';
    let notfound_text = session.localizer.gettext(session.preferredLocale(), "notfound_message", "places");
    let message = new builder.Message(session)
        .text(notfound_text);
    // Ensure we returns only a maximum of five answers.
    if (data && data.d && data.d.results && data.d.results.length > 0) {
        for (let item of data.d.results) {
            if (isLatitudeLongitude) {
                // Bing maps Uri scheme (https://msdn.microsoft.com/en-us/library/dn217138.aspx)
                bingUrl = `https://bing.com/maps/default.aspx?rtp=pos.${place.location.geo.latitude}_${place.location.geo.longitude}~pos.${item.Latitude}_${item.Longitude}_${item.DisplayName}&rtop=0~1~0`;
            }
            else {
                bingUrl = `https://bing.com/maps/default.aspx?rtp=adr.${place.location}~pos.${item.Latitude}_${item.Longitude}_${item.DisplayName}&rtop=0~1~0`;
            }
            cards.push(new builder.ThumbnailCard(session)
                .title(item.DisplayName)
                .subtitle(`${item.AddressLine}, ${item.Locality}`)
                .buttons([
                builder.CardAction.openUrl(session, bingUrl, "get directions")
            ]));
        }
        let foundplaces_text = session.localizer.gettext(session.preferredLocale(), "foundplaces_message", "places");
        message = new builder.Message(session)
            .text(foundplaces_text)
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