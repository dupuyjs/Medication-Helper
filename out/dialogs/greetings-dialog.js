"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const builder = require("botbuilder");
let lib = new builder.Library('greetings');
lib.dialog('start', (session, args) => {
    session.send("greetings_welcome");
    session.endDialog(); // <---  DON'T FORGET TO END THE DIALOG
});
function createLibrary() {
    return lib.clone();
}
exports.createLibrary = createLibrary;
//# sourceMappingURL=greetings-dialog.js.map