const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const CAH = require("./CAH");

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
        if(!message.channel.recipient) return null;
        var testgame = new CAH(4);
        testgame.run(message.channel);
    }
}
module.exports = CardsAgainstHumanity;