const commando = require("discord.js-commando");

class RemoveLyrics extends commando.Command {
    constructor(client){
        super(client, {
            name: "removelyrics",
            aliases: ["rl"],
            group: "music",
            memberName: "removelyrics",
            description: "remove a lyrics by id",
            args: [{
                key: "id",
                label: "id",
                prompt: "ID of the lyrics",
                type: "integer"
            }]
        });
    }
    async run(message, args){
        await this.client.LyricsAPI.remove(args.id);
        message.reply(":ok:");
    }
}
module.exports = RemoveLyrics;