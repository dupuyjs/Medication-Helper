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
let baseUrl = 'https://api.fda.gov/drug/';
class OpenFdaService {
    getMedicationFromQueryAsync(query) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!query) {
                throw new Error('query argument is empty or undefined');
            }
            let json = undefined;
            let encodedText = encodeURIComponent(query);
            let url = `${baseUrl}label.json?search=brand_name:${encodedText}&limit=10`;
            let response = yield node_fetch_1.default(url)
                .catch(error => console.error(error));
            if (response && response.status && response.status >= 200 && response.status <= 299) {
                json = yield response.json();
                return json;
            }
            return undefined;
        });
    }
    getMedicationFromIdAsync(id) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!id) {
                throw new Error('query argument is empty or undefined');
            }
            let json = undefined;
            let url = `${baseUrl}label.json?search=id:${id}&limit=1`;
            let response = yield node_fetch_1.default(url)
                .catch(error => console.error(error));
            if (response && response.status && response.status >= 200 && response.status <= 299) {
                json = yield response.json();
                return json;
            }
            return undefined;
        });
    }
}
exports.OpenFdaService = OpenFdaService;
let openFdaService = new OpenFdaService();
exports.default = openFdaService;
//# sourceMappingURL=api-openfda.js.map