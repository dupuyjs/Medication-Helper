"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
let lib = new builder.Library('greetings');
lib.dialog('start', (session, args) => {
    let cards = getCardsAttachments(session);
    if (args === 'default') {
        session.send("greetings_lost");
    }
    else {
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
function getCardsAttachments(session) {
    return [
        new builder.HeroCard(session)
            .title(session.localizer.gettext(session.preferredLocale(), 'greetings_menu_title_findplace', "greetings"))
            .subtitle(session.localizer.gettext(session.preferredLocale(), 'greetings_menu_subtitletitle_findplace', "greetings"))
            .buttons([
            builder.CardAction.imBack(session, "Find a medical location", "Select")
        ]),
        new builder.HeroCard(session)
            .title(session.localizer.gettext(session.preferredLocale(), 'greetings_menu_title_medication'), "greetings")
            .subtitle(session.localizer.gettext(session.preferredLocale(), 'greetings_menu_subtitletitle_medication'), "greetings")
            .buttons([
            builder.CardAction.imBack(session, "I need details about a medication", "Select")
        ])
    ];
}
exports.getCardsAttachments = getCardsAttachments;
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=greetings-dialog.js.map