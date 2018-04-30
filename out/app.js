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
const restify = require("restify");
const builder = require("botbuilder");
const storage = require("botbuilder-azure");
// Dialogs
// <<< --- DECLARE YOUR LIBRARIES HERE --- >>>
const greetings = require("./dialogs/greetings-dialog");
// Loading environment variables
const dotenv = require('dotenv').config();
// Table storage
const enableAzureTableState = process.env.ENABLE_STATE_AZURE_TABLE === 'true' || false;
const stateAzureTableName = process.env.STATE_AZURE_TABLE_NAME || '';
const stateAzureStorageAccountName = process.env.STATE_AZURE_STORAGE_ACCOUNT_NAME || '';
const stateAzureStorageAccountKey = process.env.STATE_AZURE_STORAGE_ACCOUNT_KEY || '';
// Setup restify server
let server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 8080, () => {
    console.log('%s listening to %s', server.name, server.url);
});
// Create chat connector for communicating with the Bot Framework Service
let connector = new builder.ChatConnector({
    appId: process.env.MICROSOFT_APP_ID,
    appPassword: process.env.MICROSOFT_APP_PASSWORD
});
// Listen for messages from users 
server.post('/api/messages', connector.listen());
// Receive messages from the user and respond
var bot = new builder.UniversalBot(connector, {
    localizerSettings: { defaultLocale: "en" }
});
if (enableAzureTableState) {
    console.log(`State will be stored in Azure Table Storage. Table Name: ${stateAzureTableName}, Storage Name: ${stateAzureStorageAccountName}`);
    let azureTableClient = new storage.AzureTableClient(stateAzureTableName, stateAzureStorageAccountName, stateAzureStorageAccountKey);
    let tableStorage = new storage.AzureBotStorage({ gzipData: false }, azureTableClient);
    bot.set('storage', tableStorage);
}
// <<< --- ADD YOUR LIBRARIES HERE --- >>>
bot.library(greetings.createLibrary());
// Send greetings to user when joining the conversation
bot.on('conversationUpdate', (message) => {
    if (message.membersAdded) {
        message.membersAdded.forEach((identity) => {
            if (identity.id !== message.address.bot.id) {
                bot.beginDialog(message.address, "greetings:start");
            }
        });
    }
});
// First dialog
bot.dialog('/', [
    function (session) {
        return __awaiter(this, void 0, void 0, function* () {
            builder.Prompts.text(session, "Hello... What's your name?");
        });
    },
    function (session, results) {
        session.userData.name = results.response;
        builder.Prompts.number(session, "Hi " + results.response + ", How many years have you been coding?");
    },
    function (session, results) {
        session.userData.coding = results.response;
        builder.Prompts.choice(session, "What language do you code Node using?", ["JavaScript", "CoffeeScript", "TypeScript"]);
    },
    function (session, results) {
        session.userData.language = results.response.entity;
        session.send("Got it... " + session.userData.name +
            " you've been programming for " + session.userData.coding +
            " years and use " + session.userData.language + ".");
    }
]);
//# sourceMappingURL=app.js.map