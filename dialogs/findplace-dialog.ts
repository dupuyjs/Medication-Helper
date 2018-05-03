import * as builder from 'botbuilder';
import { ListStyle, IEntity } from 'botbuilder'
import spatialData, { EntityType, SpatialData } from "../services/api-bingspatialdata";

let locationDialog = require('botbuilder-location');
let lib = new builder.Library('places');

// Extends IEntity interface to support entity resolution.
declare interface IEntityEx extends builder.IEntity {
    resolution: any;
}

// Data interface that will be saved in the dialog states
interface IStoredData {
    type: string
    location: any
}

// Dialog triggered on Intent.FindPlace (ex. Find a Pharmacy in Paris)
lib.dialog('findplace', [
    (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let place: IStoredData;
        let heathplace: boolean = false

        if (args && args.intent) {
            let intent = args.intent;
            // Get Place.Type and Place.Location entities
            let typeEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Type') as IEntityEx;
            let locationEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Location') as IEntityEx;

            place = session.dialogData.place = {
                type: typeEntity ? typeEntity.resolution.values[0] : undefined,
                location: locationEntity ? locationEntity.entity : undefined,
            };

            // We want to manage only medical places
            heathplace = place.type == 'hospital' || place.type == 'pharmacy';
        }

        if (!heathplace) {
            builder.Prompts.choice(session, "choice_prompt", "hospital|pharmacy", { listStyle: ListStyle.button });
        }
        else {
            if (next) return next();
        }
    },
    (session: builder.Session, results: builder.IDialogResult<IEntity>, next?: (results?: builder.IDialogResult<any>) => void) => {
        let place: IStoredData = session.dialogData.place;
        if (results && results.response) {
            place.type = session.dialogData.place.type = results.response.entity;
        }

        // Check if we already have a location
        if (place.location) {
            if (next) return next()
        }

        let location_text = session.localizer.gettext(session.preferredLocale(), "location_prompt", "places")

        // Trigger prompt to get the user location
        let options = {
            prompt: location_text,
            useNativeControl: true,
            reverseGeocode: true,
            skipConfirmationAsk: true,
            skipFavorites: true,
            requiredFields:
                locationDialog.LocationRequiredFields.locality
        };

        try {
            locationDialog.getLocation(session, options);
        }
        catch (error) {
            console.error("locationDialog.getLocation failed. " + error);
        }
    },
    async (session: builder.Session, results: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let place: IStoredData = session.dialogData.place;
        if (results && results.response) {
            place.location = session.dialogData.place.location = results.response;
        }

        let type = (place.type == 'pharmacy') ? EntityType.Pharmacy : EntityType.Hospital;

        // We have a location and type of location - we can perform the search
        try {
            
            let data = undefined;

            if (place.location.geo && place.location.geo.latitude && place.location.geo.longitude) {
                data = await spatialData.getSpatialDataFromLatitudeLongitudeAsync(place.location.geo.latitude, place.location.geo.longitude, type);
            }
            else {
                data = await spatialData.getSpatialDataFromAddressAsync(place.location, type);
            }

            let message = formatCarouselMessage(session, place, data);
            session.send(message);
        }
        catch (error) {
            console.error("spatialData.getSpatialDataFromAreaAsync. " + error);
        }

        return session.endDialog()
    }
]).triggerAction({ matches: 'Intent.Places.FindLocation' });


/**
 * Format points of interest to a carousel message
 * @method formatCarouselMessage
 * @param {builder.Session} session
 * @param {IStoredData} place
 * @param {SpatialData} data
 */
function formatCarouselMessage(session: builder.Session, place: IStoredData, data: SpatialData): builder.Message {
    let cards = new Array<builder.HeroCard>();
    let isLatitudeLongitude: boolean;

    if (place.location.geo && place.location.geo.latitude && place.location.geo.longitude) {
        isLatitudeLongitude = true;
    }
    else {
        isLatitudeLongitude = false;
    }

    let bingUrl = 'https://bing.com';

    let notfound_text = session.localizer.gettext(session.preferredLocale(), "notfound_message", "places")
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
                ])
            );
        }

        let foundplaces_text = session.localizer.gettext(session.preferredLocale(), "foundplaces_message", "places")
        message = new builder.Message(session)
            .text(foundplaces_text)
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(cards);
    }

    return message;
}

export function createLibrary(): builder.Library {
    return lib.clone();
}