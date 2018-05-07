import * as builder from 'botbuilder';
import { SiteUrl } from '../helpers/helper-siteurl';

let lib = new builder.Library('greetings');

lib.dialog('start',
    (session: builder.Session, args: any) => {
        let cards = getCardsAttachments(session);

        if (args === 'default') {
            session.send("greetings_lost");
        } else {
            session.send("greetings_details_firstline");
            session.send("greetings_details_secondline");
        }

        // Create reply with Carousel AttachmentLayout
        var message = new builder.Message(session)
            .text("greetings_welcome")
            .attachmentLayout(builder.AttachmentLayout.carousel)
            .attachments(cards);

        session.send(message);
        session.endDialog(); // <---  DON'T FORGET TO END THE DIALOG
    });

export function getCardsAttachments(session: builder.Session) {
    return [
        new builder.HeroCard(session)
            .title(session.localizer.gettext(session.preferredLocale(), 'greetings_menu_title_findplace', "greetings"))
            .subtitle(session.localizer.gettext(session.preferredLocale(), 'greetings_menu_subtitletitle_findplace', "greetings"))
            // .images([
            //     builder.CardImage.create(session, `${SiteUrl.get()}/assets/05.jpg`)
            // ])
            .buttons([
                builder.CardAction.imBack(session, "Find a medical location", "Select")
            ]),

        new builder.HeroCard(session)
            .title(session.localizer.gettext(session.preferredLocale(), 'greetings_menu_title_medication'), "greetings")
            .subtitle(session.localizer.gettext(session.preferredLocale(), 'greetings_menu_subtitletitle_medication'), "greetings")
            // .images([
            //     builder.CardImage.create(session, `${SiteUrl.get()}/assets/09.jpg`)
            // ])
            .buttons([
                builder.CardAction.imBack(session, "I need details about a medication", "Select")
            ])
    ];
}

export function createLibrary() {
    return lib.clone();
}