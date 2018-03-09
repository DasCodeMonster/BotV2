const commando = require("discord.js-commando");
const {Message, Collection} = require("discord.js");
const LyricsAPI = require("../../lyricsAPI");
const Lyrics = require("../../lyrics");

class AddLyrics extends commando.Command {
    constructor(client){
        super(client, {
            name: "addlyrics",
            aliases: ["al"],
            group: "music",
            memberName: "addlyrics",
            description: "add a lyrics",
            args: [{
                key: "author",
                label: "author",
                prompt: "author of the song",
                type: "string"
            }, {
                key: "title",
                label: "title",
                prompt: "name of the song",
                type: "string"
            }, {
                key: "links",
                label: "links",
                prompt: "YT links to the song",
                type: "string",
                default: "none"
            }, {
                key: "genre",
                label: "genre",
                prompt: "genry of the song",
                type: "string",
                default: "none"
            }, {
                key: "lyrics",
                label: "lyrics",
                prompt: "songtext of the song",
                type: "string",
                infinite: true
            }]
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, Args){
        var args = {
            /**
             * @type {String}
             */
            author: Args.author,
            /**
             * @type {String}
             */
            title: Args.title,
            /**
             * @type {String[]}
             */
            lyrics: Args.lyrics,
            /**
             * @type {String}
             */
            genre: Args.genre,
            /**
             * @type {String}
             */
            links: Args.links
        }
        console.log(args);
        var ytlinks = [];
        if (args.links !== "none"){
            args.links.trim().split(",").forEach((link, index, array)=>{
                ytlinks.push(link.trim());
            });
        }
        if (args.genre === "none"){
            args.genre = null;
        }
        var songtext = "";
        args.lyrics.forEach((part, index, array)=>{
            songtext += part;
        });
        await this.client.LyricsAPI.add(args.author, args.title, songtext, args.genre, ytlinks);
        await message.reply(":ok:");
    }
}
module.exports = AddLyrics;