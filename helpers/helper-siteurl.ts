import { URL } from 'url';

/**
 * Static class to get Site Url
 * @class SiteUrl
 */
export class SiteUrl {
    static siteUrl: URL;
    static set(url: URL) { this.siteUrl = url };
    static get() {
        return this.siteUrl.origin;
    }
}