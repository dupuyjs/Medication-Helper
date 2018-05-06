"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Static class to get Site Url
 * @class SiteUrl
 */
class SiteUrl {
    static set(url) { this.siteUrl = url; }
    ;
    static get() {
        return this.siteUrl.origin;
    }
}
exports.SiteUrl = SiteUrl;
//# sourceMappingURL=helper-siteurl.js.map