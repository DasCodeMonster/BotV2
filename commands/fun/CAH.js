const token = require("uid-generator");
const generator = new token(256);
const {Message, PermissionOverwrites,DMChannel} = require("discord.js");
class CardsAgainstHumanityGame {
    constructor(playercount){
        this.token = generator.generateSync();
        this.playercount = playercount;
    }
    /**
     * 
     * @param {DMChannel} channel
     */
    async run(channel){
        var collector = await channel.createMessageCollector(m =>{
            if(Number.parseInt(m.content)<=10){
                return true;
            }   
            else return false;
        }, {time: 15000});
        collector.options.max = 1;
        collector.on("collect", (msg, col)=>{
            console.log(Number.parseInt(msg.content));
        });
        collector.on("end", (colected, reason)=>{
            console.log(colected.size);
        });
    }
    join(){

    }
}
module.exports = CardsAgainstHumanityGame;