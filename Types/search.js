const ArgumentType = require("../node_modules/discord.js-commando/src/types/base");

class Search extends ArgumentType {
    constructor(client) {
        super(client, "search");
        this.option = new Set(["-s"]);
    }
    validate(value, msg , arg) {
        // console.log(arg);
        const lc = value.toLowerCase();
        return this.option.has(lc);
    }
    parse(value) {
        const lc = value.toLowerCase();
        if (this.option.has(lc)) return lc;
        else throw new RangeError("Unknown option.");
    }
}
module.exports = Search;