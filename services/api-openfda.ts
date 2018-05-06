import fetch from 'node-fetch';

let baseUrl = 'https://api.fda.gov/drug/'

export class OpenFdaService {

    public async getMedicationFromQueryAsync(query: string): Promise<ResponseData | undefined> {

        if (!query) {
            throw new Error('query argument is empty or undefined')
        }

        let json: ResponseData|undefined = undefined;
        let encodedText = encodeURIComponent(query);
        let url = `${baseUrl}label.json?search=brand_name:${encodedText}&limit=10`;

        let response = await fetch(url)
            .catch(error => console.error(error));

        if (response && response.status && response.status >= 200 && response.status <= 299) {
            json = await response.json();
            return json;
        }

        return undefined;
    }

    public async getMedicationFromIdAsync(id: string): Promise<ResponseData | undefined> {

        if (!id) {
            throw new Error('query argument is empty or undefined')
        }

        let json: ResponseData|undefined = undefined;
        let url = `${baseUrl}label.json?search=id:${id}&limit=1`;

        let response = await fetch(url)
            .catch(error => console.error(error));

        if (response && response.status && response.status >= 200 && response.status <= 299) {
            json = await response.json();
            return json;
        }

        return undefined;
    }
}

let openFdaService = new OpenFdaService();
export default openFdaService;

export interface ResponseData {
    meta: Meta;
    results: Result[];
}

export interface Meta {
    disclaimer: string;
    terms: string;
    license: string;
    last_updated: string;
    results: Results;
}

export interface Results {
    skip: number;
    limit: number;
    total: number;
}

export interface Result {
    effective_time: string;
    purpose?: string[];
    keep_out_of_reach_of_children?: string[];
    questions?: string[];
    pregnancy_or_breast_feeding?: string[];
    storage_and_handling?: string[];
    indications_and_usage: string[];
    set_id: string;
    id: string;
    ask_doctor_or_pharmacist?: string[];
    active_ingredient?: string[];
    dosage_and_administration_table: string[];
    inactive_ingredient?: string[];
    warnings: string[];
    spl_product_data_elements: string[];
    ask_doctor?: string[];
    openfda: Openfda;
    version: string;
    dosage_and_administration: string[];
    stop_use?: string[];
    spl_unclassified_section: string[];
    do_not_use?: string[];
    package_label_principal_display_panel: string[];
    drug_interactions?: string[];
    geriatric_use?: string[];
    abuse?: string[];
    precautions?: string[];
    pharmacodynamics?: string[];
    description?: string[];
    labor_and_delivery?: string[];
    mechanism_of_action?: string[];
    pharmacokinetics?: string[];
    dependence?: string[];
    description_table?: string[];
    teratogenic_effects?: string[];
    pediatric_use?: string[];
    contraindications?: string[];
    drug_abuse_and_dependence?: string[];
    pregnancy?: string[];
    nursing_mothers?: string[];
    boxed_warning?: string[];
    drug_and_or_laboratory_test_interactions?: string[];
    controlled_substance?: string[];
    adverse_reactions?: string[];
    how_supplied?: string[];
    information_for_patients?: string[];
    spl_medguide?: string[];
    clinical_pharmacology?: string[];
    carcinogenesis_and_mutagenesis_and_impairment_of_fertility?: string[];
    nonteratogenic_effects?: string[];
    spl_medguide_table?: string[];
    overdosage?: string[];
    when_using?: string[];
    active_ingredient_table?: string[];
    purpose_table?: string[];
}

export interface Openfda {
    product_ndc: string[];
    is_original_packager?: boolean[];
    package_ndc: string[];
    generic_name: string[];
    spl_set_id: string[];
    brand_name: string[];
    manufacturer_name: string[];
    unii: string[];
    rxcui: string[];
    spl_id: string[];
    substance_name: string[];
    product_type: string[];
    route: string[];
    application_number: string[];
    original_packager_product_ndc?: string[];
    upc?: string[];
}
