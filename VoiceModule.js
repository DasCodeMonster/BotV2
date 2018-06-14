const {Guild, Message, VoiceChannel, GuildMember, VoiceReceiver} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const VoiceClient = require("./VoiceClient");
const {EventEmitter} = require("events");
const Player = require("./Player");
const SearchMessage = require("./searchMessage");
const {spawn} = require("child_process");
const Filehandler = require("./filehandler");
const {Readable} = require("stream");

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
                this.voiceConnection = undefined;
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
        this.filehandler = new Filehandler("Audio", "./");
    }
    /**
     * 
     * @param {Message} message
     * @param {String} query
     */
    async youtubeSearch(message, query){
        await this.searchMessage.create(message, query);
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
    /**
     * 
     * @param {GuildMember} member 
     * @param {string} name
     * @param {number} duration
     */
    async record(member, name, duration){
        try {
            if(duration > 300) throw new Error("Duration was too big");
            if(!member.voiceChannel || !member.guild.voiceConnection || (member.voiceChannelID !== member.guild.voiceConnection.channel.id)) throw new Error("Cannot record!");
            /**
             * @type {Readable}
             */
            let stream;
            if(member.id === this.client.user.id){
                // stream = new Readable({read: size=>{

                // }});
                // member.guild.voiceConnection.dispatcher.streams.opus.on("data", data=>{
                //     stream.push(data);
                // });
                // setTimeout(()=>{
                //     stream.unpipe();
                //     stream.push(null);
                // }, duration*1000);
                throw new Error("Cannot record the bot!");
            }else {
                const receiver = member.guild.voiceConnection.createReceiver();
                stream = receiver.createStream(member.id, {mode: "pcm", end: "silence"});
                setTimeout(()=>{
                    receiver.packets._stoppedSpeaking(member.id);
                }, duration*1000);
            }
            // stream.on("end", ()=>{
            //     receiver.createStream(member, {mode: "pcm", end: "silence"})
            // });
            // stream.on("data", data=>{
            //     console.log("received packet");
            // });
            stream.on("error", err=>{
                console.log("input error: ", err);
            });
            let child = spawn("ffmpeg", [
                "-y",
                "-f", "s16le", "-ac", "2", "-ar", "48000",
                // "-codec", "pcm_s16le",
                "-i", "pipe:0",
                "-f", "opus",
                // "-codec", "opus",
                "pipe:1"
            ]);
            stream.pipe(child.stdin);
            child.stdin.on("error", err=>{
                console.log(err);
            });
            child.stderr.on("data", data=>{
                console.log(data.toString());
            });
            return this.filehandler.write(member.guild.id, name, "opus", child.stdout);
        } catch (e) {
            console.log(e);
        }
    }
}
module.exports = VoiceModule;