const commando = require("discord.js-commando");
const getYt = require("../../ytsong");
const Queue = require("../../myQueue");
const Audioworker = require("../../audioworker");
const {Message} = require("discord.js");
const Logger = require("../../logger");
const util = require("util");
const VoiceModule = require("../../VoiceModule");

class Play extends commando.Command {
    constructor(client) {
        super(client, {
            name: "play",
            group: "music",
            memberName: "play",
            description: "Plays the song from the given link directly",
            guildOnly: true,
            argsSingleQuotes: true,
            args: [{
                key: "link",
                label: "link",
                prompt: "Which song would you like to play? Just give me the link!",
                type: "ytlink"
            }]
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {Object} args 
     */
    async run(message, args) {
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
        var ID = args.link.id;
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
        if (args.link.type ==="single") {
            // this.addSingle(ID, message, args, queue);
            var song = await getYt.Single(args.link.link, message).catch(reason=>{
                logger.error(reason);
            });
            // await queue.play(message, song).catch(reason=>{
            //     logger.error(reason);
            // });
            await voiceModule.player.play(message, song);
        }
        else {
            // this.addPlaylist(message, args, ID, queue);
            var songs = await getYt.Playlist(ID, message).catch(reason=>{
                logger.error(reason);
            });
            // await queue.play(message, songs).catch(reason=>{
            //     queue.logger.error(reason);
            // });

            await voiceModule.player.play(message, songs);
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @returns {boolean}
     */
    hasPermission(message, args){
        var command = this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}})
        // if (message.member.hasPermission("ADMINISTRATOR")|| command.true.indexOf(message.author.id) != -1 || command.channel.true.indexOf(message.channel.id)>-1 || role(message, command)){
        if(message.member.hasPermission("ADMINISTRATOR")){
            return true;
        }
        if(command.false.indexOf(message.author.id)>-1||command.channel.false.indexOf(message.channel.id)>-1||role(message, command)) return false;
        else {
            return true;
        }
    }
}
/**
 * @param {*} command
 * @param {Message} message
 * @returns {boolean}
 */
function role(message, command) {
    var ret;
    message.member.roles.array().some((role, index, array) => {
        if(command.role.true.indexOf(role.id) >-1) {
            ret = true;
            return true;
        }
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = Play;