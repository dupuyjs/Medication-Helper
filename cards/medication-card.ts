class MedicineCard {

    public getMedicineCard(substance: string, translation: string) {
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
export default medicineCard;