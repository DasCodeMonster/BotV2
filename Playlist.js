const {Collection, Util, MessageEmbed} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const Song = require("./Song");
const util = require("util");

class Playlist extends EventEmitter {
    constructor(){
        super();
        /**
         * @type {Collection<Number,Song>}
         */
        this.list = new Collection();
        this.list.set(0, null);
        this.loop = {
            song: false,
            list: false
        };
        this._listMessage = new Collection();
        this.length = 0;
    }
}
module.exports = Playlist;
