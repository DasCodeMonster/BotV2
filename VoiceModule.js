const {Guild} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const Player = require("./Player");

class VoiceModule extends EventEmitter {
    /**
     * 
     * @param {CommandoClient} client 
     * @param {Guild} guild 
     */
    constructor(client, guild){
        super();
        this.client = client;
        this.guild = guild;
        this.player = new Player(client, guild);
    }
}
module.exports = VoiceModule;