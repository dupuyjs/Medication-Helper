import fetch from "node-fetch";

/**
 * Computer Vision API - v1.0 Client SDK (https://westus.dev.cognitive.microsoft.com/docs/services/56f91f2d778daf23d8ec6739/operations/56f91f2e778daf14a499e1fa)
 * @class VisionServices
 */
export class VisionServices {

    /**
     * Describes the image content with a complete English sentence
     * @method getCaptionFromImageAsync
     * @param {Buffer} imageBuffer
     * Required. Binary image data.
     * @returns {string}
     */
    public async getCaptionFromImageAsync(imageBuffer: Buffer): Promise<string | undefined> {

        if (!imageBuffer) {
            throw new Error('imageBuffer argument is empty or undefined')
        }

        // Getting the image size
        let imgSize = Buffer.byteLength(imageBuffer).toString();

        let visionApiUrl = process.env.COGNITIVE_VISION_API_URL;
        let visionApiKey = process.env.COGNITIVE_VISION_API_KEY;

        // Check if environment variables are correct
        if (visionApiUrl == undefined || visionApiKey == undefined) {
            throw new Error('vision api key or url is undefined')
        }

        visionApiUrl = `${visionApiUrl}/analyze?visualFeatures=Description`;

        var response = await fetch(visionApiUrl,
            {
                method: 'POST',
                headers:
                    {
                        'content-type': 'application/octet-stream',
                        'Ocp-Apim-Subscription-Key': visionApiKey,
                        'content-length': imgSize
                    },
                body: imageBuffer,
            })
            .catch(error => console.error(error));

        if (response && response.status && response.status >= 200 && response.status <= 299) {
            var results = await response.json();
            return results.description.captions[0].text;;
        }

        return undefined;
    };

    /**
     * Detects text in an image and extracts the recognized characters into a 
     * machine-usable character stream.
     * @method getTextFromImageAsync
     * @param {Buffer} imageBuffer
     * Required. Binary image data.
     * @param {string} language
     * Optional. The BCP-47 language code of the text to be detected in the image.
     * The default value is "unk", then the service will auto detect the language of the text in the image.
     * @returns {string}
     */
    public async getTextFromImageAsync(imageBuffer: Buffer, language: string = 'unk'): Promise<OcrResult | undefined> {

        if (!imageBuffer)
            return undefined;

        // Getting the image size
        let imgSize = Buffer.byteLength(imageBuffer).toString();

        let visionApiUrl = process.env.COGNITIVE_VISION_API_URL;
        let visionApiKey = process.env.COGNITIVE_VISION_API_KEY;

        // Check if environment variables are correct
        if (visionApiUrl == undefined || visionApiKey == undefined)
            return undefined;

        visionApiUrl = `${visionApiUrl}/ocr?language=${language}&detectOrientation=true`;

        var response = await fetch(visionApiUrl,
            {
                method: 'POST',
                headers:
                    {
                        'content-type': 'application/octet-stream',
                        'Ocp-Apim-Subscription-Key': visionApiKey,
                        'content-length': imgSize
                    },
                body: imageBuffer,
            })
            .catch(error => console.error(error));;

        if (response && response.status && response.status >= 200 && response.status <= 299) {
            var results = await <OcrResult>response.json();
            return results;
        }

        return undefined;
    }

    /**
     * Helper method to get language from OcrResult.
     * @method getLanguageFromOcrResult
     * @param {OcrResult} ocrResult
     * Required. OcrResult instance.
     * @returns {string}
     */
    public getLanguageFromOcrResult(ocrResult: OcrResult) : string {
        return ocrResult.language;
    }

    /**
     * Helper method to get an array which contains all words from an OCR result.
     * @method getTextFromOcrResult
     * @param {OcrResult} ocrResult
     * Required. OcrResult instance.
     * @returns {Array<string>}
     */
    public getTextFromOcrResult(ocrResult: OcrResult): Array<string> {

        let results = new Array<string>();

        if (ocrResult.regions) {
            ocrResult.regions.forEach(region => {
                if (region.lines) {
                    region.lines.forEach(line => {
                        let text : string = "";
                        if (line.words) {
                            line.words.forEach(word => {
                                text += `${word.text} `;
                            });
                            results.push(text);
                        }
                    });
                }
            });
        }

        return results;
    }
}

export interface OcrResult {
    language?: string,
    textAngle?: number,
    orientation?: string,
    regions?: Array<OcrResultRegion>
}

export interface OcrResultRegion {
    boundingBox?: string,
    lines?: Array<OcrResultLine>
}

export interface OcrResultLine {
    boundingBox?: string,
    words?: Array<OcrResultWord>
}

export interface OcrResultWord {
    boundingBox?: string,
    text: string,
}

let visionServices = new VisionServices();
export default visionServices;