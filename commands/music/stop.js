const {Message} = require("discord.js");
const {Command} = require("discord.js-commando");
const VoiceModule = require("../../VoiceModule");

class Stop extends Command{
    constructor(client){
        super(client, {
            name: "stop",
            group: "music",
            memberName: "stop",
            description: "The bot will stop playing music",
            guildOnly: true
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args){
        /**
         * @type {VoiceModule}
         */
        let voiceModule;
        if(this.client.VoiceModules.has(message.guild.id)){
            voiceModule = this.client.VoiceModules.get(message.guild.id);
        }else {
            voiceModule = new VoiceModule(this.client, message.guild);
            this.client.VoiceModules.set(message.guild.id, voiceModule);
        }
        voiceModule.player.stop();
    }
}
module.exports = Stop;