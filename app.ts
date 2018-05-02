import * as restify from 'restify';
import * as builder from 'botbuilder';
import { IConversationUpdate, IIdentity } from 'botbuilder';
import * as storage from 'botbuilder-azure';

// Services and helpers
import openmedicament from "./services/api-openmedicaments";
import translator from "./services/cognitive-translator";

// Dialogs
// <<< --- DECLARE YOUR LIBRARIES HERE --- >>>
let locationDialog = require('botbuilder-location');

import * as greetings from './dialogs/greetings-dialog';
import * as composition from './dialogs/drug-composition-dialog';
import * as places from './dialogs/findplace-dialog';


// Loading environment variables
const dotenv = require('dotenv').config(); 

// Table storage
const enableAzureTableState =  process.env.ENABLE_STATE_AZURE_TABLE === 'true' || false;
const stateAzureTableName = process.env.STATE_AZURE_TABLE_NAME || '';
const stateAzureStorageAccountName = process.env.STATE_AZURE_STORAGE_ACCOUNT_NAME || ''; 
const stateAzureStorageAccountKey = process.env.STATE_AZURE_STORAGE_ACCOUNT_KEY || '';

//=========================================================
// Bot Setup
//=========================================================

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

// Bot instantiation
var bot = new builder.UniversalBot(connector, { 
    localizerSettings: { defaultLocale: "en"}});

// Enable conversation states (storage in azure)
if (enableAzureTableState) {
    console.log(`State will be stored in Azure Table Storage. Table Name: ${stateAzureTableName}, Storage Name: ${stateAzureStorageAccountName}`);
    let azureTableClient = new storage.AzureTableClient(stateAzureTableName, stateAzureStorageAccountName, stateAzureStorageAccountKey);
    let tableStorage = new storage.AzureBotStorage({gzipData: false}, azureTableClient);
    bot.set('storage', tableStorage);
}

//=========================================================
// Bot Dialogs Configuration
//=========================================================

// <<< --- ADD YOUR LIBRARIES HERE --- >>>
bot.library(locationDialog.createLibrary(process.env.BING_MAPS_API_KEY));
bot.library(greetings.createLibrary());
bot.library(composition.createLibrary());
bot.library(places.createLibrary());

// Conversation Update - Send greetings to user when joining the conversation
bot.on('conversationUpdate', (message: IConversationUpdate) => {
    if (message.membersAdded) {
        message.membersAdded.forEach((identity: IIdentity) => {
            if (identity.id !== message.address.bot.id) {
                bot.beginDialog(message.address, "greetings:start");
            }
        });
    }
});

// Adding natural language support (Language Understanding)
const luis = process.env.COGNITIVE_LUIS_URL || '';
let luisRecognizer = new builder.LuisRecognizer(luis);
bot.recognizer(luisRecognizer);