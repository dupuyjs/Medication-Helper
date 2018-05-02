import fetch from 'node-fetch';

let baseUrl = 'http://spatial.virtualearth.net/REST/v1/data/c2ae584bbccc4916a0acf75d1e6947b4/NavteqEU/NavteqPOIs'

/**
 * Bing Spatial Data Services Client SDK (NAVTEQEU Data Source)
 * @class BingSpatialDataService
 */
export class BingSpatialDataService {

    /**
     * Get points of interest that are within a specified area (latitude, longitude)
     * @method getSpatialDataFromAreaAsync
     * @param {string} latitude
     * @param {string} longitude
     * @param {EntityType} type
     * @returns {SpatialData}
     */
    public async getSpatialDataFromAreaAsync(latitude: string, longitude: string, type: EntityType): Promise<SpatialData> {

        if (!latitude || !longitude) {
            throw new Error('query argument is empty or undefined')
        }

        let json = undefined
        let url = `${baseUrl}?spatialFilter=nearby(${latitude},${longitude},100)&$filter=EntityTypeID Eq ${type}&$format=json&$top=5&key=${process.env.BING_MAPS_API_KEY}`;

        let response = await fetch(url)
            .catch(error => console.error(error))

        if (response) {
            json = await response.json()
        }

        return json;
    }
}

export enum EntityType {
    Pharmacy = '9565',
    Hospital = '8060',
    MedicalService = '9583'
}

export interface SpatialData {
    d: D;
}

export interface D {
    __copyright: string;
    results: Result[];
}

export interface Result {
    __metadata: Metadata;
    EntityID: string;
    Name: string;
    DisplayName: string;
    AddressLine: string;
    Locality: string;
    AdminDistrict2: string;
    AdminDistrict: string;
    PostalCode: string;
    CountryRegion: string;
    LanguageCode: string;
    Latitude: number;
    Longitude: number;
    Phone: string;
    EntityTypeID: string;
}

export interface Metadata {
    uri: string;
}

let bingSpatialDataService = new BingSpatialDataService();
export default bingSpatialDataService;