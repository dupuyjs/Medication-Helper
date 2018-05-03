import nodefetch from "node-fetch";

export class VisionServices {

    // Describes the image content with a complete English sentence.
    public async getCaptionFromImageAsync(imageBuffer: Buffer) {

        if (!imageBuffer)
            return undefined;

        // Getting the image size
        let imgSize = Buffer.byteLength(imageBuffer).toString();

        let visionApiUrl = process.env.COGNITIVE_VISION_API_URL;
        let visionApiKey = process.env.COGNITIVE_VISION_API_KEY;

        // Check if environment variables are correct
        if (visionApiUrl == undefined || visionApiKey == undefined)
            return undefined;

        visionApiUrl = `${visionApiUrl}/analyze?visualFeatures=Description`;

        var response = await nodefetch(visionApiUrl,
            {
                method: 'POST',
                headers:
                    {
                        'content-type': 'application/octet-stream',
                        'Ocp-Apim-Subscription-Key': visionApiKey,
                        'content-length': imgSize
                    },
                body: imageBuffer,
            });

        if (response && response.status && response.status >= 200 && response.status <= 299) {
            var results = await response.json();
            return results.description.captions[0].text;;
        }

        return undefined;
    };

    // Detects text in an image and extracts the recognized characters into a 
    // machine-usable character stream.
    public async getTextFromImageAsync(imageBuffer: Buffer, culture?: string): Promise<OcrResult | undefined> {

        if (!imageBuffer)
            return undefined;

        // Getting the image size
        let imgSize = Buffer.byteLength(imageBuffer).toString();

        let visionApiUrl = process.env.COGNITIVE_VISION_API_URL;
        let visionApiKey = process.env.COGNITIVE_VISION_API_KEY;

        // Check if environment variables are correct
        if (visionApiUrl == undefined || visionApiKey == undefined)
            return undefined;

        let language = culture ? culture : 'unk';

        visionApiUrl = `${visionApiUrl}/ocr?language=${language}&detectOrientation=true`;

        var response = await nodefetch(visionApiUrl,
            {
                method: 'POST',
                headers:
                    {
                        'content-type': 'application/octet-stream',
                        'Ocp-Apim-Subscription-Key': visionApiKey,
                        'content-length': imgSize
                    },
                body: imageBuffer,
            });

        if (response && response.status && response.status >= 200 && response.status <= 299) {
            var results = await <OcrResult>response.json();
            return results;
        }

        return undefined;
    }

    // Helper methode to get language from OcrResult.
    public getLanguageFromOcrResult(ocrResult: OcrResult) {
        return ocrResult.language;
    }


    // Helper method to get an array which contains all words from an OCR result.
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