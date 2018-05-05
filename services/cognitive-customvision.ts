import fetch, * as nodefetch from "node-fetch";

/**
 * Custom Vision Prediction 1.1 API Client SDK (https://southcentralus.dev.cognitive.microsoft.com/docs/services/57982f59b5964e36841e22dfbfe78fc1/operations/5a3044f608fa5e06b890f164)
 * @class CustomVisionServices
 */
export class CustomVisionServices {

    VISION_PROBA_THRESHOLD = 0.5;

    /**
     * Predict if an image is a medication package.
     * @method isMedicineImage
     * @param {Buffer} imageBuffer
     * Required. Binary image data.
     * @returns {string}
     */
    async isMedicineImage(imageBuffer: Buffer): Promise<Boolean | undefined> {

        let imgSize = Buffer.byteLength(imageBuffer).toString();

        let visionUrl = process.env.COGNITIVE_CUSTOM_VISION_API_URL;
        let visionKey = process.env.COGNITIVE_CUSTOM_VISION_API_KEY;

        if (visionUrl == undefined || visionKey == undefined) {
            throw new Error('custom vision api key or url is undefined')
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

            })
            .catch(error => console.error(error));;

        if (response && response.status && response.status >= 200 && response.status <= 299) {
            let answer = await response.json();

            for (let prediction of answer['Predictions']) {
                if (prediction.Tag == 'Medication') {
                    let proba = prediction.Probability;
                    return (proba >= this.VISION_PROBA_THRESHOLD)
                }
            }
        }

        return false;
    }
}

let customVisionServices = new CustomVisionServices();
export default customVisionServices;