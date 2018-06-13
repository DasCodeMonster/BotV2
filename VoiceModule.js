const {Guild, Message, VoiceChannel, GuildMember} = require("discord.js");
const {CommandoClient} = require("discord.js-commando");
const VoiceClient = require("./VoiceClient");
const {EventEmitter} = require("events");
const Player = require("./Player");
const SearchMessage = require("./searchMessage");
const {spawn} = require("child_process");
const Filehandler = require("./filehandler");

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
     */
    async record(member, name){
        try {
            if(!member.voiceChannel || !member.guild.voiceConnection || (member.voiceChannelID !== member.guild.voiceConnection.channel.id)) throw new Error("Cannot record!");
            let stream2 = receiver.createStream(member.id, {mode: "opus", end: "silence"});
            stream2.on("data", data=>{
                console.log("opus data");
            });
            const receiver = member.guild.voiceConnection.createReceiver();
            let stream = receiver.createStream(member.id, {mode: "pcm", end: "silence"});
            stream.on("data", data=>{
                console.log("received packet");
            });
            stream.on("error", err=>{
                console.log("input error: ", err);
            });
            let child = spawn("ffmpeg", [
                "-y",
                "-f", "s16le",
                "-i", "pipe:0",
                "-f", "opus",
                "pipe:1"
            ]);
            stream.pipe(child.stdin);
            child.stdin.on("error", err=>{
                console.log(err);
            });
            child.stdout.on("data", data=>{
                console.log("transcoded packet");
            });
            child.stderr.on("data", data=>{
                console.log(data.toString());
            });
            this.filehandler.write(member.guild.id, name, "opus", child.stdout);

            // let pr = spawn("ffmpeg", ["-y", "-codec", "pcm_s16le", "-i", "pipe:0", "-codec", "opus", "./test.opus"]);
            // this.filehandler.write(member.guild.id, name, "opus", pr.stdout);
            // pr.stdout.on("data", data=>{
            //     console.log(data);
            // });
            // pr.on("exit", (code, signal)=>{
            //     console.log("Exit with code: ", code);
            // });
            // pr.on("error", error=>{
            //     console.log(error);
            // });
        } catch (e) {
            console.log(e);
        }
    }
}
module.exports = VoiceModule;