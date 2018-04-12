const {ArgumentType, CommandMessage, Argument} = require("discord.js-commando");
const {TextChannel} = require("discord.js");

class TextchannelArgument extends ArgumentType{
    constructor(client){
        super(client, "textchannel");

    }
    /**
     * 
     * @param {String} value 
     * @param {CommandMessage} msg 
     * @param {Argument} arg 
     */
    validate(value, msg, arg){
        let channelarg = this.client.registry.types.get("channel");
        if(channelarg.validate(value, msg, arg) && channelarg.parse(value, msg, arg) instanceof TextChannel) return true;
        else return false;
    }
    parse(value, msg, arg){
        let channelarg = this.client.registry.types.get("channel");
        return channelarg.parse(value, msg, arg);
    }
}
module.exports = TextchannelArgument;