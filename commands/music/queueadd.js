const commando = require("discord.js-commando");
const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");
const Queue = require("./myQueue");
const {Message} = require("discord.js");

class List extends commando.Command {
    constructor(client) {
        super(client, {
            name: "queueadd",
            aliases: ["qa", "qadd", "add"],
            group: "music",
            memberName: "queueadd",
            description: "Adds a song to the queue",
            guildOnly: true,
            args: [{
                key: "link",
                label: "link",
                prompt: "Which song would you like to add to the queue? Just give me the link!",
                type: "ytlink"
            }]
        });
        this.IDs = [];
        this.pages = 0;
    }
    /**
     * 
     * @param {Message} message 
     * @param {Object} args 
     */
    async run(message, args) {
        console.log(args.link);
        var ID = args.link.id;
        /**
         * @type {Queue}
         */
        await this.client.provider.remove(message.guild, "queue");
        var queue = await this.client.provider.get(message.guild, "queue", new Queue());
        console.log(queue);
        if (message.guild.voiceConnection) {
            if (args.link.type ==="single") {
                this.addSingle(message, args, ID, queue);
            }
            else {
                this.addPlaylist(message, args, ID);
            }
        }
        else {
            if (message.member.voiceChannel) {
                message.member.voiceChannel.join();
                if (args.link.type === "single") {
                    this.addSingle(message, args, ID, queue);
                }
                else {
                    this.addPlaylist(message, args, ID);
                }              
            }
            else {
                message.reply("you need to join a voicechannel first");
            }
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @param {*} ID 
     * @param {Queue} queue
     */
    async addSingle(message, args, ID, queue) {
        await youtubeV3.videos.list({
            part: "snippet, contentDetails",
            id: ID
        }, (err, data) => {
            if (err) console.log(err);
            else {
                data.items.forEach(item => {
                    queue.addSingle(this.song(message, args, item));
                    // this.queue.push(this.song(message, args, item));
                });
                if(message.guild.voiceConnection.dispatcher) return;
                else this.play(message, queue);
            }
        });
    }
    async addPlaylist(message, args, ID) {
        //var listId = args.link.split("list=")[1];
        var Data = [];
        console.log(ID);
        await youtubeV3.playlistItems.list({
            part: "snippet",
            playlistId: ID,
            maxResults: "50"
        }, (err, data) => {
            if (err) {
                console.warn(err);
                message.reply("an Error occurred!");
                return;
            }
            else {
                if (!message.guild.voiceConnection){
                    message.member.voiceChannel.join();
                }
                
                //console.log(data);
                var firstPage = [];
                data.items.forEach((item, index) => {
                    console.log(item);
                    if (item.snippet.resourceId.videoId) {
                        firstPage.push(item.snippet.resourceId.videoId);
                    }
                    if (index === data.items.length-1) {
                        console.log(firstPage.length);
                        this.IDs.push(firstPage);
                        console.log(firstPage);
                        console.log(this.IDs);
                        this.pages +=1;
                        if (data.nextPageToken) {
                            this.fetchAllPages(ID, data.nextPageToken, err => {
                                if (err) {
                                    console.log(err);
                                }
                                else {
                                    console.log("playlist fetched");
                                    console.log(this.IDs);
                                    //this.IDs.reverse();
                                    var i = 0;
                                    this.IDs.forEach((page, index) => {
                                        youtubeV3.videos.list({
                                            part: "snippet, contentDetails",
                                            id: page.join(", ")
                                        }, (err, data) => {
                                            if (err) console.log(err);
                                            else {
                                                console.log(`\n${index}\n${page}\n${page.length}\n`);
                                                var songs = [];
                                                data.items.forEach(item => {
                                                    songs.push(this.song(message, args, item));
                                                });
                                                Data.splice(index,0,songs);
                                                i+=1;
                                                console.log(i);
                                                console.log(this.pages);
                                                console.log(i === this.pages);
                                                console.log(i == this.pages);
                                                if (i === this.pages) {
                                                    console.log("ok");
                                                    Data.forEach((songs, index) => {
                                                        songs.forEach((song, index) => {
                                                            this.queue.push(song);
                                                        });
                                                    });
                                                    // console.log(this.queue);
                                                    if(message.guild.voiceConnection.dispatcher) return;
                                                    else this.play(message);
                                                }
                                            }
                                        });
                                    });
                                }
                            });
                        }
                        else {
                            var i = 0;
                            youtubeV3.videos.list({
                                part: "snippet, contentDetails",
                                id: firstPage.join(", ")
                            }, (err, data) => {
                                if (err) console.log(err);
                                else {
                                    var songs = [];
                                    data.items.forEach(item => {
                                        songs.push(this.song(message, args, item));
                                        console.log(songs);
                                    });
                                    i+=1;
                                    if (i === this.pages) {
                                        Data.forEach((songs, index) => {
                                            songs.forEach((song, index) => {
                                                this.queue.push(song);
                                            });
                                        });
                                        console.log(this.queue);
                                        if(message.guild.voiceConnection.dispatcher) return;
                                        else this.play(message);
                                    }
                                }
                            });
                        }
                    }
                });
            }
        });
    }
    async fetchAllPages(listId, PageToken, callback) {
        await youtubeV3.playlistItems.list({
            part: 'snippet',
            playlistId: listId,
            maxResults: "50",
            pageToken: PageToken
        }, (err, nextPageResults) => {
            if (err) {
                callback(err);
                return;
            }
            else{
                console.log("test");
                var page = [];
                nextPageResults.items.forEach((item, index) => {
                    if (item.snippet.resourceId.videoId) {
                        page.push(item.snippet.resourceId.videoId);
                    }
                    if (index === nextPageResults.items.length-1) {
                        console.log(page.length);
                        this.IDs.push(page);
                        this.pages += 1;
                        if (nextPageResults.nextPageToken){
                            this.fetchAllPages(listId, nextPageResults.nextPageToken, callback);
                        }
                        else{
                            callback(null);
                        }
                    }
                });
            }
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @param {*} item 
     */
    song(message, args, item) {
        var match = /PT((\d+)H)?((\d+)M)?((\d+)S)?/.exec(item.contentDetails.duration)
        var tmp = ""
        if (match[2]) {
            tmp += match[2] + ":"
        }
        if (match[4]) {
            tmp += ("00" + match[4]).slice(-2) + ":"
        } else {
            tmp += "00:"
        }
        if (match[6]) {
            tmp += ("00" + match[6]).slice(-2)
        } else {
            tmp += "00"
        }
        var song = new Song(item.id, item.snippet.title, item.snippet.channelTitle, tmp, message.member.id);
        return song;
    }
    /**
     * 
     * @param {Message} message 
     * @param {Queue} queue 
     */
    async play(message, queue) {
        console.log(queue);
        if (queue.queue.length >= 0) {
            var vid = queue.nowPlaying;
            console.log(vid);
            console.log(vid.ID);
            this.client.provider.set(message.guild, "queue", queue);
            await message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
            await message.guild.voiceConnection.dispatcher.setVolume(await this.client.provider.get(message.guild, "volume", 0.3));
            await message.channel.send("Now playing: "+vid.title);
            message.guild.voiceConnection.dispatcher.on("end", reason => {
                if(reason) console.log(reason);
                this.onEnd(message, queue);
            });
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {String} reason 
     * @param {Queue} queue 
     */
    async onEnd(message, queue) {
        // console.log("File ended");
        if (queue.queue.length >=1) {
            if (reason && reason !== "!skip") {
                await queue.skip();
            }
            else {
                await queue.next();       
            }
            var vid = queue.nowPlaying;
            console.log(vid);
            await message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
            await message.guild.voiceConnection.dispatcher.setVolume(await this.client.provider.get(message.guild, "volume", 0.3));
            await message.channel.send("Now playing: "+vid.title);
            await message.guild.voiceConnection.dispatcher.on("end", reason => {
                if (reason) console.log(reason);
                this.onEnd(message);
            });
            await this.client.provider.set(message.guild, "queue", queue);
        }
        else {
            this.client.provider.set(message.guild, "queue", queue);
            console.log("queue is empty");
            return;
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @returns {boolean}
     */
    hasPermission(message, args){
        var command = this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}})
        // if (message.member.hasPermission("ADMINISTRATOR")|| command.true.indexOf(message.author.id) != -1 || command.channel.true.indexOf(message.channel.id)>-1 || role(message, command)){
        if(message.member.hasPermission("ADMINISTRATOR")){
            return true;
        }
        if(command.false.indexOf(message.author.id)>-1||command.channel.false.indexOf(message.channel.id)>-1||role(message, command)) return false;
        else {
            return true;
        }
    }
}
/**
 * @param {*} command
 * @param {Message} message
 * @returns {boolean}
 */
function role(message, command) {
    var ret;
    message.member.roles.array().some((role, index, array) => {
        if(command.role.true.indexOf(role.id) >-1) ret = true;return true;
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = List;