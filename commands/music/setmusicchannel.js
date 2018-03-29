const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");
const Logger = require("../../logger");
const util = require("util");

class SetMusicChannel extends commando.Command {
    constructor(client){
        super(client, {
            name: "setmusicchannel",
            aliases: ["setchannel", "channel"],
            group: "music",
            memberName: "setmusicchannel",
            description: "Sets the Textchannel of a guild, where all the non-responded messages about music will be send.",
            guildOnly: true,
            args: [{
                key: "channel",
                label: "channel",
                prompt: "You need to specify a textchannel!",
                type: "channel",
                wait: 30
            }]
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args){
        if(this.client.loggers.has(message.guild.id)){
            /**
             * @type {Logger}
             */
            var logger = this.client.loggers.get(message.guild.id);
        }else{
            var logger = new Logger(message.guild.id);
            this.client.loggers.set(message.guild.id, logger);
        }
        logger.log(message.author.username+"#"+message.author.discriminator, "("+message.author.id+")", "used", this.name, "command in channel:", message.channel.name, "("+message.channel.id+")\nArguments:", util.inspect(args));
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
        await queue.setChannel(args.channel);
        await message.reply("Ok i set the channel!");
    }
}
module.exports = SetMusicChannel;