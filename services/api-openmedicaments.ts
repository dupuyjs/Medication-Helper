import fetch from 'node-fetch';

let baseUrl = 'https://open-medicaments.fr/api/v1/medicaments'

/**
 * Open Medicaments API Client SDK (https://www.open-medicaments.fr/#/home) (French)
 * @class OpenMedicamentsService
 */
export class OpenMedicamentsService {

    /**
     * Get an array of MedicationCode from query string (medication name)
     * @method getMedicationCodeFromQueryAsync
     * @param {string} query
     * @returns {Array<MedicationCode>}
     */
    public async getMedicationCodeFromQueryAsync(query: string): Promise<Array<MedicationCode>> {

        if (!query) {
            throw new Error('query argument is empty or undefined')
        }

        let json = undefined
        let encodedQuery = encodeURIComponent(query);
        let url = `${baseUrl}?query=${encodedQuery}`;

        let response = await fetch(url)
            .catch(error => console.error(error))

        if (response) {
            json = await response.json()
        }

        return json;
    }

    /**
     * Get a Medication from CIS code (incl. in MedicationCode)
     * @method getMedicationFromIdAsync
     * @param {string} id
     * @returns {Medication}
     */
    public async getMedicationFromIdAsync(id: string): Promise<Medication> {

        if (!id) {
            throw new Error('id argument is empty or undefined')
        }

        let json = undefined
        let url = `${baseUrl}/${id}`;

        let response = await fetch(url)
            .catch(error => console.error(error))

        if (response) {
            json = await response.json()
        }

        return json;
    }
}

export interface MedicationCode {
    codeCIS: string;
    denomination: string;
}

export interface Medication {
    codeCIS: string;
    denomination: string;
    formePharmaceutique: string;
    homeopathie: boolean;
    voiesAdministration: string[];
    statutAdministratifAMM: string;
    typeProcedureAMM: string;
    etatCommercialisation: boolean;
    dateAMM: string;
    statutBDM: string;
    numeroAutorisationEuropeenne: string;
    titulaires: string[];
    surveillanceRenforcee: boolean;
    indicationsTherapeutiques: string;
    presentations: Presentation[];
    compositions: Composition[];
    avisSMR: AvisSMR[];
    avisASMR: any[];
    conditionsPrescriptionDelivrance: any[];
    infosGenerique: null;
    infosImportantes: any[];
    familleComposition: FamilleComposition[];
    interactions: Interaction[];
    substancesActives: SubstancesActive[];
    fractionsTherapeutiques: any[];
}

export interface AvisSMR {
    codeDossierHAS: string;
    motifEvaluation: string;
    dateAvisCommissionTransparence: string;
    valeurSMR: string;
    libelleSMR: string;
    urlHAS: string;
}

export interface Composition {
    designationElementPharmaceutique: string;
    referenceDosage: string;
    substancesActives: SubstancesActive[];
}

export interface SubstancesActive {
    codeSubstance: string;
    denominationSubstance: string;
    dosageSubstance: string;
    interactions: Interaction[];
    fractionsTherapeutiques: any[];
}

export interface Interaction {
    id: string;
    idFamille1: string;
    famille1: string;
    idFamille2: string;
    famille2: string;
}

export interface FamilleComposition {
    codeCIS: string;
    denomination: string;
}

export interface Presentation {
    codeCIP7: string;
    libelle: string;
    statutAdministratif: string;
    etatCommercialisationAMM: string;
    dateDeclarationCommercialisation: string;
    codeCIP13: string;
    agrementCollectivites: boolean;
    tauxRemboursement: string[];
    prix: number | null;
    indicationsRemboursement: string;
}

let openMedicamentService = new OpenMedicamentsService();
export default openMedicamentService;