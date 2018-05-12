const {Guild, Message, VoiceChannel} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const {EventEmitter} = require("events");
const Player = require("./Player");

class VoiceModule extends EventEmitter {
    /**
     * 
     * @param {CommandoClient} client 
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
    }
    /**
     * Joins a voicechannel and starts playing music
     * @param {Message} message 
     * @param {VoiceChannel} channel channel to join
     */
    async join(message, channel=undefined){
        try{
            if(channel){
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