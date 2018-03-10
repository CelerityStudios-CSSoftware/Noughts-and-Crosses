const config = require('./config')

const IdGenerator = {
    generateId: () => {
        let id = "";
        const charSets = ["abcdefghijklmnopqrstuvwxyz", "0123456789"];
        const random_nb = (min, max) => {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        };

        let i = 0;
        while (i < config.game.connectionIdLength) {
            const charSet = charSets[random_nb(0, charSets.length - 1)];
            id += charSet[random_nb(0, charSet.length - 1)];
            i += 1;
        }
        return id;
    }
};

module.exports = IdGenerator;
