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
                key: "lyrics",
                label: "lyrics",
                prompt: "songtext of the song",
                type: "string"
            }, {
                key: "genre",
                label: "genre",
                prompt: "genry of the song",
                type: "string",
                default: "none"
            }, {
                key: "links",
                label: "links",
                prompt: "YT links to the song",
                type: "string",
                default: "none"
            }]
        });
        /**
         * @type {LyricsAPI}
         */
        this.LyricsAPI = client.LyricsAPI;
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args){
        await this.client.LyricsAPI.add(args.author, args.title, args.lyrics);
        await message.reply(":ok:");
    }
}
module.exports = AddLyrics;