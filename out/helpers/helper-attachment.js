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
class ImageAttachmentHelper {
    // Check if message contains an image attachment.
    hasImageAttachment(message) {
        if (message && message.attachments) {
            return message.attachments.length > 0 &&
                message.attachments[0].contentType.indexOf('image') !== -1;
        }
        return false;
    }
    // The Skype and Teams attachment URLs are secured by JwtToken.
    checkRequiresToken(message) {
        if (message && message.source) {
            return message.source === 'skype' || message.source === 'msteams';
        }
        return false;
    }
    // You should set the JwtToken of your bot as the authorization header 
    // for the GET request your bot initiates to fetch the image.
    getAccessTokenAsync(connector) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((rs, rj) => connector.getAccessToken((err, at) => err ? rj(err) : rs(at)));
        });
    }
    // Get the stream from image in attachment.
    getImageFromMessageAsync(message, connector) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!message || !message.attachments || message.attachments.length <= 0)
                return undefined;
            let attachment = message.attachments[0];
            let token = undefined;
            let headers = {};
            if (this.checkRequiresToken(message)) {
                // The Skype and Teams attachment URLs are secured by JwtToken.
                // You should set the JwtToken of your bot as the authorization header for the GET request your bot initiates to fetch the image.
                try {
                    token = yield this.getAccessTokenAsync(connector);
                    headers['Authorization'] = 'Bearer ' + token;
                }
                catch (error) {
                    token = undefined;
                }
            }
            let response;
            if (attachment.contentUrl) {
                headers['Content-Type'] = 'application/octet-stream';
                response = yield node_fetch_1.default(attachment.contentUrl, { headers: headers });
                if (response && response.status && response.status >= 200 && response.status <= 299) {
                    return yield response.buffer();
                }
            }
            return undefined;
        });
    }
}
let imageAttachmentHelper = new ImageAttachmentHelper();
exports.default = imageAttachmentHelper;
//# sourceMappingURL=helper-attachment.js.map