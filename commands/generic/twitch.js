const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const Tokens = require("../../Token&Keys");
// const curl = require("curl");
const Logger = require("../../logger");
const util = require("util");

class Webhookcommand extends commando.Command {
    constructor(client){
        super(client, {
            name: "twitch",
            aliases: ["twit"],
            group: "generic",
            memberName: "twitch",
            description: "Checks if a Twitchstreamer is streaming",
            args: [{
                key: "TwitchUsername",
                label: "TwitchUsername",
                prompt: "Tell me a TwitchUsername!",
                type: "string"
            }]
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {Object} args
     * @returns {void} 
     */
    run(message, args){
        console.log("not available");
        return;
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
        curl.getJSON("https://api.twitch.tv/helix/users?login="+args.TwitchUsername, {headers:{"Client-ID": Tokens.TwitchClientID}}, async(err, response)=>{
            if (err) {
                console.log(err);
                var sry = await message.reply("An Error occurred! Please try again!");
                await sry.react(":x:");
            }
            else{
                var tojson = JSON.parse(response.body);
                if(tojson.data.length === 0){
                    message.reply("You provided an invalid TwitchUsername! Please try again!");
                    return;
                }
                var id = tojson.data[0].id;
                var displayName = tojson.data[0].display_name;
                var login = tojson.data[0].login;
                var webhooks = await message.guild.fetchWebhooks();
                webhooks.first().send(id);
                curl.getJSON("https://api.twitch.tv/helix/streams?user_id="+id, {headers:{"Client-ID":Tokens.TwitchClientID}}, async(error, res)=>{
                    if(error){
                        console.log(error);
                        var sry = await message.reply("An Error occurred! Please try again!");
                        await sry.react(":x:");
                    }
                    else{
                        var resjson = JSON.parse(res.body);
                        console.log(resjson);
                        if (resjson.data.length === 0){
                            webhooks.first().send(displayName+" is currently Offline!");
                            return;
                        }
                        var url = "https://www.twitch.tv/"+login;
                        webhooks.first().send(displayName+" is live! Go check out the stream at "+url);
                    }
                })
            }
        });
    }
}
module.exports = Webhookcommand;