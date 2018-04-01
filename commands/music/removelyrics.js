const commando = require("discord.js-commando");
const Logger = require("../../logger");
const util = require("util");

class RemoveLyrics extends commando.Command {
    constructor(client){
        super(client, {
            name: "removelyrics",
            aliases: ["rl"],
            group: "music",
            memberName: "removelyrics",
            description: "remove a lyrics by id",
            args: [{
                key: "id",
                label: "id",
                prompt: "ID of the lyrics",
                type: "integer"
            }]
        });
    }
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
        await this.client.LyricsAPI.remove(args.id);
        message.reply(":ok:");
    }
}
module.exports = RemoveLyrics;