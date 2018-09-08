const LETTER_SCORE_MAPPING = {
    ' ': 1,
    'e': 1,
    't': 1,
    'a': 1,
    'o': 1,
    'i': 1,
    'n': 1,
    's': 1,
    'h': 1,
    'r': 1,
    'd': 2,
    'l': 2,
    'c': 2,
    'u': 2,
    'm': 2,
    'w': 2,
    'f': 2,
    'g': 2,
    'y': 2,
    'p': 2,
    'b': 2,
    'v': 2,
    'k': 2,
    'j': 3,
    'x': 3,
    'q': 3,
    'z': 3,
    'é': 4,
    'è': 4,
    'à': 4,
    'ç': 4,
    'ê': 5,
    'ë': 5,
    'ä': 5,
    'ô': 5,
    'ö': 5,
    'ï': 5,
    'î': 5,
    'û': 5,
    'ü': 5,
    'ÿ': 5,
    'æ': 6,
    'á': 6,
    'ã': 6,
    'å': 6,
    'ā': 6,
    'ę': 6,
    'ė': 6,
    'ē': 6,
    'ì': 6,
    'í': 6,
    'į': 6,
    'ī': 6,
    'œ': 6,
    'ò': 6,
    'ó': 6,
    'õ': 6,
    'ø': 6,
    'ō': 6,
    'ù': 6,
    'ú': 6,
    'ū': 6,
};

const LETTER_COMBO_MAPPING = {
    0: {
        default: 1,
        snail: 1,
        masochist: 1,
    },
    10: {
        default: 2,
        snail: 1,
        masochist: 3,
    },
    30: {
        default: 4,
        snail: 2,
        masochist: 6,
    },
    60: {
        default: 8,
        snail: 4,
        masochist: 12,
    },
    100: {
        default: 16,
        snail: 8,
        masochist: 24,
    },
};

export default {
    getLetterScoreMapping() {
        return LETTER_SCORE_MAPPING;
    },

    getFinalMultiplier(letterCombo, isSnail, isMasochist, isResilient, level) {
        const combo = this._getCurrentCombo(letterCombo, isSnail, isResilient, isMasochist);
        return isResilient ? combo + (level - 1) * 2 : combo + level - 1;
    },

    _getCurrentCombo(letterCombo, isSnail, isMasochist) {
        const mappingKey = Object.keys(LETTER_COMBO_MAPPING).reduce((prev, current) => {
            return letterCombo > current ? current : prev;
        });
        let comboDifficulty = 'default';
        if (isSnail && !isMasochist) {
            comboDifficulty = 'snail';
        } else if (isMasochist && !isSnail) {
            comboDifficulty = 'masochist';
        }
        return LETTER_COMBO_MAPPING[mappingKey][comboDifficulty];
    },
};
