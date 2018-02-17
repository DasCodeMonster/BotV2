const commando = require("discord.js-commando");
const Queue = require("./myQueue");
const QueueConfig = require("./queueConfig");
const {Message} = require("discord.js");
const Audioworker = require("../../audioworker");

class Loop extends commando.Command {
    constructor(client) {
        super(client, {
            name: "loop",
            group: "music",
            memberName: "loop",
            description: "loops the playlist or the song.",
            guildOnly: true,
            args: [{
                key: "songorlist",
                label: "song Or List",
                prompt: "invalid option",
                type: "song_or_list",
                default: "default",
                infinite: false
            }, {
                key: "boolean",
                label: "boolean",
                prompt: "true or false?",
                default: "default",
                type: "optionalbool",
                infinite: false
            }]
        });
    }
    async run(message, args) {
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
        if (args.songorlist === "default" && args.boolean === "default") {
            message.reply(`Current settings for list: ${queue.loop.list}\nCurrent settings for song: ${queue.loop.song}`);
            
        }
        else if (args.songorlist !== "default" && args.boolean === "default") {
            if(args.songorlist === "song"){
                message.reply(`Current settings for ${args.songorlist}: ${queue.loop.song}`);                
            }
            else if(args.songorlist === "list") {
                message.reply(`Current settings for ${args.songorlist}: ${queue.loop.list}`);
            }
        } else if (args.songorlist !== "default" && args.boolean !== "default") {
            if(args.songorlist === "song"){
                queue.setLoopSong(args.boolean);
            }
            if(args.songorlist === "list"){
                queue.setLoopList(args.boolean);
            }
            message.reply(`set loop ${args.songorlist} to ${args.boolean}`);
        } else if (args.songorlist === "default" && args.boolean !== "default") {
            message.reply(`you need to be more precise! Do you want to set loop list or loop song to ${args.boolean}`);
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
        if(command.role.true.indexOf(role.id) >-1) ret = true;return true;
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = Loop;