import * as builder from 'botbuilder';
import { ListStyle, IEntity } from 'botbuilder'
import spatialData, { EntityType, SpatialData } from "../services/api-bingspatialdata";

let locationDialog = require('botbuilder-location');
let lib = new builder.Library('places');

// Extends IEntity interface to support entity resolution.
declare interface IEntityEx extends builder.IEntity {
    resolution: any;
}

interface IStoredData {
    type: string
    location: any
}

lib.dialog('findplace', [
    (session: builder.Session, args: any, next?: (results?: builder.IDialogResult<any>) => void) => {
        let place: IStoredData;
        let heathplace: boolean = false

        if (args && args.intent) {
            let intent = args.intent;
            let typeEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Type') as IEntityEx;
            let locationEntity: IEntityEx = builder.EntityRecognizer.findEntity(intent.entities, 'Place.Location') as IEntityEx;

            place = session.dialogData.place = {
                type: typeEntity ? typeEntity.resolution.values[0] : undefined,
                location: locationEntity ? locationEntity.resolution : undefined,
            };

            // We want to manage only medical places
            heathplace = place.type == 'hospital' || place.type == 'pharmacy';
        }

        if (!heathplace) {
            builder.Prompts.choice(session, "choice_prompt", "hospital|pharmacy", { listStyle: ListStyle.button });
        }
        else {
            if (next) next();
        }
    },
    (session: builder.Session, results: builder.IDialogResult<IEntity>, next?: (results?: builder.IDialogResult<any>) => void) => {
        let place: IStoredData = session.dialogData.place;
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

        try {
            let data = await spatialData.getSpatialDataFromAreaAsync(place.location.geo.latitude, place.location.geo.longitude, EntityType.Pharmacy);

            let message = formatCarouselMessage(session, place, data);
            session.send(message);
        }
        catch (error) {
            console.error("spatialData.getSpatialDataFromAreaAsync. " + error);
        }
        
        session.endDialog()
    }
]).triggerAction({ matches: 'Intent.FindPlace' });


function formatCarouselMessage(session: builder.Session, place: IStoredData, data: SpatialData): builder.Message {
    let cards = new Array<builder.HeroCard>();

    let userLatitude = place.location.geo.latitude;
    let userLongitude = place.location.geo.longitude;

    let bingUrl = 'https://bing.com';
    let message = new builder.Message().text("Oups. No item found. It seems I cannot help you at the moment :(.");

    // Ensure we returns only a maximum of five answers.
    if (data && data.d && data.d.results && data.d.results.length > 0) {

        for(let item of data.d.results) {
            
            if (userLatitude && userLongitude && item.Latitude && item.Longitude) {
                // Bing maps Uri scheme (https://msdn.microsoft.com/en-us/library/dn217138.aspx)
                bingUrl = `https://bing.com/maps/default.aspx?rtp=pos.${userLatitude}_${userLongitude}~pos.${item.Latitude}_${item.Longitude}_${item.DisplayName}&rtop=0~1~0`;
            }

            cards.push(new builder.ThumbnailCard(session)
                .title(item.DisplayName)
                .subtitle(`${item.AddressLine}, ${item.Locality}` )
                .buttons([
                    builder.CardAction.openUrl(session, bingUrl, "get directions")
                ])
            );
        }

        session.send(data.d.__copyright);
        
        message = new builder.Message(session)
            .text("We found the following places for you.")
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(cards);
    }

    return message;
}

export function createLibrary(): builder.Library {
    return lib.clone();
}