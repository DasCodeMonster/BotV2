const commando = require("discord.js-commando");
const {Message, Collection} = require("discord.js");
const LyricsAPI = require("../../lyricsAPI");

class Lyrics extends commando.Command {
    constructor(client){
        super(client, {
            name: "lyrics",
            aliases: ["l"],
            group: "music",
            memberName: "lyrics",
            description: "Displays the lyrics of the currently played song",
            guildOnly: true,
            args: [{key: "q",
                label: "query",
                prompt: "what do you want to search for?",
                type: "string"
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
        console.log(this.client.LyricsAPI.searchTitle("Hello"));
        var lyrics = this.client.LyricsAPI.searchTitle(args.q)[0];
        console.log(lyrics);
        if(lyrics){
            await message.reply(lyrics.lyrics);
        }
        // await message.reply(this.client.LyricsAPI.searchTitle(args.q)[0]);
    }
}
module.exports = Lyrics;