import { ChatConnector, IMessage, IConnector } from "botbuilder";
import fetch, * as nodefetch from 'node-fetch';

class ImageAttachmentHelper {

    // Check if message contains an image attachment.
    public hasImageAttachment(message: IMessage): boolean {
        if (message && message.attachments) {
            return message.attachments.length > 0 &&
                message.attachments[0].contentType.indexOf('image') !== -1;
        }

        return false;
    }

    // The Skype and Teams attachment URLs are secured by JwtToken.
    public checkRequiresToken(message: IMessage): boolean {
        if (message && message.source) {
            return message.source === 'skype' || message.source === 'msteams';
        }

        return false;
    }

    // You should set the JwtToken of your bot as the authorization header 
    // for the GET request your bot initiates to fetch the image.
    public async getAccessTokenAsync(connector: ChatConnector): Promise<string> {
        return new Promise<string>((rs, rj) =>
            connector.getAccessToken((err, at) =>
                err ? rj(err) : rs(at)));
    }

    // Get the stream from image in attachment.
    public async getImageFromMessageAsync(message: IMessage, connector: IConnector): Promise<Buffer | undefined> {

        if (!message || !message.attachments || message.attachments.length <= 0)
            return undefined;

        let attachment = message.attachments[0];

        let token: string | undefined = undefined;
        let headers: { [header: string]: string } = {};

        if (this.checkRequiresToken(message)) {
            // The Skype and Teams attachment URLs are secured by JwtToken.
            // You should set the JwtToken of your bot as the authorization header for the GET request your bot initiates to fetch the image.
            try {
                token = await this.getAccessTokenAsync(<ChatConnector>connector);
                headers['Authorization'] = 'Bearer ' + token;
            } catch (error) {
                token = undefined;
            }
        }

        let response: nodefetch.Response;

        if (attachment.contentUrl) {
            headers['Content-Type'] = 'application/octet-stream';
            response = await fetch(attachment.contentUrl, { headers: headers });

            if (response && response.status && response.status >= 200 && response.status <= 299) {
                return await response.buffer();
            }
        }

        return undefined;
    }
}

let imageAttachmentHelper = new ImageAttachmentHelper();
export default imageAttachmentHelper;