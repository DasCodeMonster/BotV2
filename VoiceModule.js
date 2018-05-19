const {Guild, Message, VoiceChannel} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const VoiceClient = require("./VoiceClient");
const {EventEmitter} = require("events");
const Player = require("./Player");
const SearchMessage = require("./searchMessage");

class VoiceModule extends EventEmitter {
    /**
     * 
     * @param {VoiceClient} client 
     * @param {Guild} guild 
     */
    constructor(client, guild){
        super();
        this.client = client;
        this.guild = guild;
        this.player = new Player(client, guild);
        this.voiceConnection = guild.voiceConnection || undefined;
        if(this.voiceConnection){
            this.voiceConnection.once("disconnect", reason=>{
                this.voiceConnection = undefined
            });
        }
        this.searchMessage = new SearchMessage(this.client, this.guild, this.player, this.voiceConnection);
        this.searchMessage.on("add", song=>{
            this.player.queue.add(song);
        });
        this.searchMessage.on("play", (message, song)=>{
            console.log(song);
            this.player.play(message, song);
        });
    }
    /**
     * 
     * @param {Message} message
     * @param {String} query
     */
    async youtubeSearch(message, query){
        await this.searchMessage.create(message, query)
    }
    /**
     * Joins a voicechannel and starts playing music
     * @param {Message} message 
     * @param {VoiceChannel} channel channel to join
     */
    async join(message, channel=null){
        try{
            if(channel !== null){
                if(!(channel instanceof VoiceChannel))return new Error("must be voiceChannel");
                this.voiceConnection = await channel.join();
                this.voiceConnection.once("disconnect", reason=>{
                    this.voiceConnection = undefined;
                });
                if(this.voiceConnection){
                    if(this.voiceConnection.dispatcher === null || this.voiceConnection.dispatcher.finished){
                        await this.player.play(message);
                    }
                }
            }else{
                if(!message.member.voiceChannel){
                    message.reply("You need to join a voiceChannel first");
                    return;
                }else{
                    this.voiceConnection = await message.member.voiceChannel.join();
                    this.voiceConnection.once("disconnect", reason=>{
                        this.voiceConnection = undefined;
                    });
                    if(this.voiceConnection){
                        if(this.voiceConnection.dispatcher === null || this.voiceConnection.dispatcher.finished || !this.voiceConnection.dispatcher){
                            await this.player.play(message);
                        }
                    }
                }
            }
        }catch(e){
            console.log(e);
        }
    }
}
module.exports = VoiceModule;