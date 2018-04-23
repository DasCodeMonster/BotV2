const commando = require("discord.js-commando");
const Queue = require("../../myQueue");
const {Message, GuildMember, User} = require("discord.js");
const Audioworker = require("../../audioworker");
const Logger = require("../../logger");
const util = require("util");
const fs = require("fs");

class Record extends commando.Command {
    constructor(client) {
        super(client, {
            name: "record",
            group: "music",
            memberName: "record",
            description: "records voicedata from a user",
            guildOnly: true,
            args: [{
                key: "user",
                label: "user",
                prompt: "Which user would you like to record? Just mention him!",
                type: "user"
            }, {
                key: "name",
                label: "name",
                prompt: "How should I name your record?",
                type: "string"
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
        let err = await queue.record(message.guild.member(args.user), args.name, message);
        if(err){
            logger.error(err);
        }
    }
}
module.exports = Record;