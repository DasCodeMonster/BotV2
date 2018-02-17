const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");
const Queue = require("../music/myQueue");
const {Message, Collection} = require("discord.js");
const q = require("q");
const getYt = require("../music/ytsong");
const QueueConfig = require("../music/queueConfig");
const Audioworker = require("./../../audioworker");

class Listtest extends commando.Command {
    constructor(client) {
        super(client, {
            name: "test",
            group: "test",
            memberName: "testadd",
            description: "Adds a song to the queue",
            guildOnly: true,
            args: [{
                key: "link",
                label: "link",
                prompt: "Which song would you like to add to the queue? Just give me the link!",
                type: "ytlink"
            }, {
                key: "position",
                label: "position",
                prompt: "In which position do you want to place the song?",
                type: "integer",
                min: 1,
                default: 0,
                infinite: false
            }]
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {Object} args 
     */
    async run(message, args) {
        var testcol = new Collection()
        testcol.set("1", 1);
        testcol.set("2",2);
        testcol.set("3", testcol.get("1")+testcol.get("2"));
        console.log(testcol);
    }
    /**
     *  
     * @param {*} ID 
     * @param {Message} message
     * @param {Object} args
     * @param {Queue} queue
     */
    async addSingle(ID, message, args, queue) {
        var pos;
        if(args.position === 0){
            pos = null;
        }
        else {
            pos = args.position;
        }
        var song = await getYt.Single(args.link.link, message);
        await queue.addSingle(message, song, args.position);
        console.log(song);
        if(message.guild.voiceConnection.dispatcher) return;
        else queue.play(message);
    }
    /**
     * 
     * @param {Message} message 
     * @param {Object} args 
     * @param {*} ID 
     * @param {Queue} queue 
     */
    async addPlaylist(message, args, ID, queue) {
        var pos;
        if(args.position === 0){
            pos = null;
        }
        else {
            pos = args.position;
        }
        var songs = await getYt.Playlist(ID, message);
        queue.addList(message, songs, pos);
        if(message.guild.voiceConnection.dispatcher) return;
        else queue.play(message);
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
module.exports = Listtest;