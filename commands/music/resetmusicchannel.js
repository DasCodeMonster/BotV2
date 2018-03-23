const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");

class ResetMusicChannel extends commando.Command {
    constructor(client){
        super(client, {
            name: "resetmusicchannel",
            aliases: ["resetchannel", "rchannel"],
            group: "music",
            memberName: "resetmusicchannel",
            description: "PLACEHOLDER",
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
         * @type {Audioworker}
         */
        var audioworker = this.client.Audioworker;
        if(!audioworker.queues.has(message.guild.id)){
           var queue = audioworker.add(message.guild);
        }
        else{
            var queue = audioworker.queues.get(message.guild.id);
        }
        await queue.resetChannel();
        await message.reply("Ok");
    }
}
module.exports = ResetMusicChannel;