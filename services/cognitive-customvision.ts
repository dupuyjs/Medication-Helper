import fetch, * as nodefetch from "node-fetch";

export class CustomVisionServices {

    VISION_PROBA_THRESHOLD = 0.5;

    // Check if an image is a medication package. Use custom vision service.
    async isMedicineImage(imageBuffer: Buffer): Promise<Boolean | undefined> {

        let imgSize = Buffer.byteLength(imageBuffer).toString();

        let visionUrl = process.env.COGNITIVE_CUSTOM_VISION_API_URL;
        let visionKey = process.env.COGNITIVE_CUSTOM_VISION_API_KEY;

        if (visionUrl == undefined || visionKey == undefined) {
            return undefined;
        }

        let response = await fetch(visionUrl,
            {
                method: 'POST',
                headers:
                    {
                        'content-type': 'application/x-www-form-urlencoded',
                        'prediction-key': visionKey,
                        'content-length': imgSize
                    },
                body: imageBuffer,

            });

        if (!response || !response.status || !(response.status >= 200 && response.status <= 299)) {
            return undefined;
        }

        let answer = await response.json();
        let maxProba = 0;

        for(let prediction of answer['Predictions']) {
            if(prediction.Tag == 'Medication') {
                let proba = prediction.Probability;
                return (proba >= this.VISION_PROBA_THRESHOLD)
            }
        }

        return false;
    }
}

let customVisionServices = new CustomVisionServices();
export default customVisionServices;