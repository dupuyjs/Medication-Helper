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
let baseUrl = 'https://open-medicaments.fr/api/v1/medicaments';
class OpenMedicamentsService {
    getMedicineCodeFromQueryAsync(query) {
        return __awaiter(this, void 0, void 0, function* () {
            let json = undefined;
            let encodedQuery = encodeURIComponent(query);
            let url = `${baseUrl}?query=${encodedQuery}`;
            let response = yield node_fetch_1.default(url)
                .catch(error => console.error(error));
            if (response) {
                json = yield response.json();
            }
            return json;
        });
    }
    getMedicineFromIdAsync(id) {
        return __awaiter(this, void 0, void 0, function* () {
            let json = undefined;
            let url = `${baseUrl}/${id}`;
            let response = yield node_fetch_1.default(url)
                .catch(error => console.error(error));
            if (response) {
                json = yield response.json();
            }
            return json;
        });
    }
}
exports.OpenMedicamentsService = OpenMedicamentsService;
let openMedicamentService = new OpenMedicamentsService();
exports.default = openMedicamentService;
//# sourceMappingURL=openmedicaments-service.js.map