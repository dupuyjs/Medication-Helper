import * as builder from 'botbuilder';

let lib = new builder.Library('greetings');

lib.dialog('start',
    (session: builder.Session, args: any) => {
        session.send("greetings_welcome");
        session.endDialog(); // <---  DON'T FORGET TO END THE DIALOG
    });

export function createLibrary() {
    return lib.clone();
}