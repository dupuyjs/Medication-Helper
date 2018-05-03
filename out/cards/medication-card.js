"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class MedicineCard {
    getMedicineCard(substance, translation) {
        let card = {
            'contentType': 'application/vnd.microsoft.card.adaptive',
            'content': {
                'type': 'AdaptiveCard',
                'body': [
                    {
                        'type': 'TextBlock',
                        'text': `${translation}`,
                        'horizontalAlignment': 'center',
                        'size': 'extraLarge'
                    },
                    {
                        'type': 'TextBlock',
                        'text': `${substance}`,
                        'horizontalAlignment': 'center',
                        'isSubtle': 'true'
                    },
                ]
            }
        };
        return card;
    }
}
let medicineCard = new MedicineCard();
exports.default = medicineCard;
//# sourceMappingURL=medication-card.js.map