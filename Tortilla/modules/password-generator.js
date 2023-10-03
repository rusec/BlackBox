const argv = process.argv;

const keccak256 = require("keccak256");
const gen = require("random-seed");
const words = require('an-array-of-english-words')

/**
 * Generates an array of random passwords.
 *
 * @param {number} length - The number of passwords to generate.
 * @param {string} seeder - A seed string for the random number generator.
 * @returns {string[]} An array of randomly generated passwords.
 */
module.exports = function generatePasses(length, seeder) {
    const rng = new gen(keccak256(seeder + "shrimp_key").toString('hex'));

    const results = [];
    for (let index = 0; index < length; index++) {
        var first_word = getWord();
        first_word = first_word[0].toUpperCase() + first_word.substring(1)
        var pass = first_word + '-';
        for (let i = 0; i < 4; i++) {
            if (rng.random() > 0.5) {
                pass += rng.random() > 0.5 ? capitalizeRandomWord() : getWord()
            } else {
                pass += randomBetween(10, 1000)
            }
            if (i !== 3) {
                pass += '-'
            }
        }
        results.push(pass);
    }
    function capitalizeRandomWord() {
        var word = getWord()
        var index_cap = randomBetween(0, word.length);
        return word.substring(0, index_cap) + word[index_cap].toUpperCase() + word.substring(index_cap + 1)
    }
    function getWord() {
        let word = words[randomBetween(0, words.length)]
        while (word.length < 3 || word.length > 13) {
            word = words[randomBetween(0, words.length)]
        }
        return word;
    }

    function randomBetween(min, max) {
        return Math.floor(max * rng.random() + min);
    }
    delete rng
    return results;
};
