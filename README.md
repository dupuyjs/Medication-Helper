# Medication Helper

### Requirements to run the Bot

- Node 8.6.0

### Installation of the Bot

Run `npm install` in the `Medication-Helper` directory.

### Running the Bot

1. Download BotFramework Emulator (available for Mac, Windows, and Linux) via the [GitHub releases page](https://github.com/Microsoft/BotFramework-Emulator/releases)
2. Run `npm run start` in the `Medication-Helper` directory.
3. Start BotFramework Emulator and Select `http://localhost:8080/api/messages` to start interacting with your bot.

### Configuration

As this bot uses a number of services, you will need to create applications and generate keys for each one. The following instructions are intended to guide you on how to do this.

You can add an `.env` file in the `Medication-Helper` folder and copy the following content. You need to update the subscriptions key (and additionnal parameters) for each service.

``` text
#.env file 

# Translator Text 
COGNITIVE_TRANSLATOR_API_KEY = {YourSubscriptionKey}

# Language Understanding
COGNITIVE_LUIS_URL = https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/{YourApplicationId}?subscription-key={YourSubscriptionKey}

# Computer Vision
COGNITIVE_VISION_API_KEY = {YourSubscriptionKey}
COGNITIVE_VISION_API_URL = https://westeurope.api.cognitive.microsoft.com/vision/v1.0

# Custom Vision
COGNITIVE_CUSTOM_VISION_API_KEY = {YourSubscriptionKey}
COGNITIVE_CUSTOM_VISION_API_URL = https://southcentralus.api.cognitive.microsoft.com/customvision/v1.1/Prediction/{YourPredictionId}/image

# Bing Maps API Key
BING_MAPS_API_KEY = {YourSubscriptionKey}

```

#### Service: Language Understanding Intelligence Service (LUIS)

To register and train a LUIS Application, go to https://www.luis.ai/applications. After logging in, click `Import New App` and follow the directions. From the Upload File dialog, select the `luis.json` file under the `Medication-Helper/data` directory. When directed to the dashboard, click on `Train`. It may take a few minutes to finish. Once done, you can test your LUIS model by typing out an utterance on the `Test` pannel. Try 'find a pharmacy in Paris', for instance. Finally, click on `Publish App`, assign a key, and click `Publish`. You will be given an `Endpoint url`. Copy this URL and add it as an environment variable (or in the .env file).

