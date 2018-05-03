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
const node_fetch_1 = require("node-fetch");
class CustomVisionServices {
    constructor() {
        this.VISION_PROBA_THRESHOLD = 0.5;
    }
    // Check if an image is a medication package. Use custom vision service.
    isMedicineImage(imageBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            let imgSize = Buffer.byteLength(imageBuffer).toString();
            let visionUrl = process.env.COGNITIVE_CUSTOM_VISION_API_URL;
            let visionKey = process.env.COGNITIVE_CUSTOM_VISION_API_KEY;
            if (visionUrl == undefined || visionKey == undefined) {
                return undefined;
            }
            let response = yield node_fetch_1.default(visionUrl, {
                method: 'POST',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'prediction-key': visionKey,
                    'content-length': imgSize
                },
                body: imageBuffer,
            });
            if (!response || !response.status || !(response.status >= 200 && response.status <= 299)) {
                return undefined;
            }
            let answer = yield response.json();
            let maxProba = 0;
            for (let prediction of answer['Predictions']) {
                if (prediction.Tag == 'Medication') {
                    let proba = prediction.Probability;
                    return (proba >= this.VISION_PROBA_THRESHOLD);
                }
            }
            return false;
        });
    }
}
exports.CustomVisionServices = CustomVisionServices;
let customVisionServices = new CustomVisionServices();
exports.default = customVisionServices;
//# sourceMappingURL=cognitive-customvision.js.map