let countries = require('country-data').countries;
let languages = require('country-data').languages;

interface Language {
    code: string
    name: string
}

class CountryDataHelper {

    visionSupportedLanguages : Language[] = [
        { code: "zh-Hans", name: "Simplified Chinese" },
        { code: "zh-Hant", name: "Traditional Chinese" },
        { code: "cs", name: "Czech" },
        { code: "da", name: "Danish" },
        { code: "nl", name: "Dutch" },
        { code: "en", name: "English" },
        { code: "fi", name: "Finnish" },
        { code: "fr", name: "French" },
        { code: "de", name: "German" },
        { code: "el", name: "Greek" },
        { code: "hu", name: "Hungarian" },
        { code: "it", name: "Italian" },
        { code: "Ja", name: "Japanese" },
        { code: "ko", name: "Korean" },
        { code: "nb", name: "Norwegian" },
        { code: "pl", name: "Polish" },
        { code: "pt", name: "Portuguese" },
        { code: "ru", name: "Russian" },
        { code: "es", name: "Spanish" },
        { code: "sv", name: "Swedish" },
        { code: "tr", name: "Turkish" },
        { code: "ar", name: "Arabic" },
        { code: "ro", name: "Romanian" },
        { code: "sr-Cyrl", name: "Serbian Cyrillic" },
        { code: "sr-Latn", name: "Serbian Latin" },
        { code: "sk", name: "Slovak" }
    ];

    public getCountryByName(country: string) : any {
        let search = undefined;

        countries.all.forEach((element: any) => {
            if (element.name.toLowerCase().includes(country.toLowerCase())) {
                if (element.status === 'assigned') {
                    search = element;
                }
            }
        });

        return search;
    }

    public getCountryByCountryCode(countryCode: string) : any {
        let search = undefined;

        countries.all.forEach((element: any) => {
            if (element.alpha2.toLowerCase().includes(countryCode.toLowerCase())) {
                if (element.status === 'assigned') {
                    search = element;
                }
            }
        });

        return search;
    }

    public getVisionLanguageByName(language: string) : Array<Language> {
        let search = new Array<Language>();

        this.visionSupportedLanguages.forEach((element) => {
            if (element.name.toLowerCase().includes(language.toLowerCase())) {
                search.push(element);
            }
        });

        return search;
    }

    public getLanguageByName(language: string) : any {
        let search = undefined;

        languages.all.forEach((element: any) => {
            if (element.name.toLowerCase() == language.toLowerCase()) {
                search = element;
            }
        });

        return search;
    }
}

let countryDataHelper = new CountryDataHelper();
export default countryDataHelper;
