const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const CAH = require("./CAH");
const Logger = require("../../logger");
const util = require("util");

class CardsAgainstHumanity extends commando.Command {
    constructor(client){
        super(client, {
            name: "cardsagainsthumanity",
            aliases: ["cah"],
            group: "fun",
            memberName: "cardsagainsthumanity",
            description: "Play a nice round of CAH",
            guildOnly: false
        });
    }
    /**
     * 
     * @param {Message} message 
     */
    async run(message){
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
        if(!message.channel.recipient) return null;
        var testgame = new CAH(4);
        testgame.run(message.channel);
    }
    hasPermission(){
        return true;
    }
}
module.exports = CardsAgainstHumanity;