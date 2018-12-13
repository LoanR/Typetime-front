// export const randomNum = (range, start = 0) => {
//     return Math.floor(Math.random() * range) + start;
// };

export default {
    randomNum(range, start = 0) {
        return Math.floor(Math.random() * range) + start;
    },

    selectRandomEntities(qty, range) {
        if (qty >= range.length) {
            return range;
        }
        let selectedEntities = [];
        while (selectedEntities.length < qty) {
            selectedEntities.push(range.splice(this.randomNum(range.length), 1)[0]);
        }
        return selectedEntities;
    },
};