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
let baseUrl = 'http://spatial.virtualearth.net/REST/v1/data/c2ae584bbccc4916a0acf75d1e6947b4/NavteqEU/NavteqPOIs';
/**
 * Bing Spatial Data Services Client SDK (NAVTEQEU Data Source)
 * @class BingSpatialDataService
 */
class BingSpatialDataService {
    /**
     * Get points of interest that are within a specified area (latitude, longitude)
     * @method getSpatialDataFromAreaAsync
     * @param {string} latitude
     * @param {string} longitude
     * @param {EntityType} type
     * @returns {SpatialData}
     */
    getSpatialDataFromAreaAsync(latitude, longitude, type) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!latitude || !longitude) {
                throw new Error('query argument is empty or undefined');
            }
            let json = undefined;
            let url = `${baseUrl}?spatialFilter=nearby(${latitude},${longitude},100)&$filter=EntityTypeID Eq ${type}&$format=json&$top=5&key=${process.env.BING_MAPS_API_KEY}`;
            let response = yield node_fetch_1.default(url)
                .catch(error => console.error(error));
            if (response) {
                json = yield response.json();
            }
            return json;
        });
    }
}
exports.BingSpatialDataService = BingSpatialDataService;
var EntityType;
(function (EntityType) {
    EntityType["Pharmacy"] = "9565";
    EntityType["Hospital"] = "8060";
    EntityType["MedicalService"] = "9583";
})(EntityType = exports.EntityType || (exports.EntityType = {}));
let bingSpatialDataService = new BingSpatialDataService();
exports.default = bingSpatialDataService;
//# sourceMappingURL=api-bingspatialdata.js.map