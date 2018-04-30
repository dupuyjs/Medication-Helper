import * as restify from 'restify';
import * as builder from 'botbuilder';
import { IConversationUpdate, IIdentity } from 'botbuilder';
import * as storage from 'botbuilder-azure';

// Services and helpers
import openmedicament from "./services/api-openmedicaments";
import translator from "./services/cognitive-translator";

// Dialogs
// <<< --- DECLARE YOUR LIBRARIES HERE --- >>>
import * as greetings from './dialogs/greetings-dialog';

// Loading environment variables
const dotenv = require('dotenv').config(); 

// Table storage
const enableAzureTableState =  process.env.ENABLE_STATE_AZURE_TABLE === 'true' || false;
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
    localizerSettings: { defaultLocale: "en"}});

if (enableAzureTableState) {
    console.log(`State will be stored in Azure Table Storage. Table Name: ${stateAzureTableName}, Storage Name: ${stateAzureStorageAccountName}`);
    let azureTableClient = new storage.AzureTableClient(stateAzureTableName, stateAzureStorageAccountName, stateAzureStorageAccountKey);
    let tableStorage = new storage.AzureBotStorage({gzipData: false}, azureTableClient);
    bot.set('storage', tableStorage);
}

// <<< --- ADD YOUR LIBRARIES HERE --- >>>
bot.library(greetings.createLibrary());

// Send greetings to user when joining the conversation
bot.on('conversationUpdate', (message: IConversationUpdate) => {
    if (message.membersAdded) {
        message.membersAdded.forEach((identity: IIdentity) => {
            if (identity.id !== message.address.bot.id) {
                bot.beginDialog(message.address, "greetings:start");
            }
        });
    }
});

// First dialog
bot.dialog('/', [
    async function (session) {
        builder.Prompts.text(session, "Hello... What's your name?");
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