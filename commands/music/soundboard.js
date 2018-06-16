const {Command, CommandMessage} = require("discord.js-commando");
const VoiceModule = require("../../VoiceModule");

class SoundBoardCommand extends Command {
    /**
     * 
     * @param {VoiceClient} client 
     */
    constructor(client){
        super(client, {
            name: "soundboard",
            memberName: "soundboard",
            aliases: ["board"],
            description: "Returns an embed soundboard",
            group: "music",
            guildOnly: true
        });
    }
    /**
     * 
     * @param {CommandMessage} message 
     * @param {*} args 
     * @param {boolean} fromPattern 
     */
    async run(message, args, fromPattern){
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
        await voiceModule.board(message.channel);
    }
    hasPermission(message){
        return true;
    }
}
module.exports = SoundBoardCommand;