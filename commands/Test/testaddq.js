const commando = require("discord.js-commando");
const {Message} = require("discord.js");
const ytdl = require("ytdl-core");
const keys = require('./../../Token&Keys');
const google = require('googleapis');
const youtubeV3 = google.youtube({version: "v3", auth: keys.YoutubeAPIKey});
const Song = require("./Song");

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
        this.queue = [];
        this.IDs = [];
        this.pages = 0;
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        console.log(args.link);
        var ID = args.link[0];
        /**
         * @type {Array}
         */
        var queue = await this.client.provider.get(message.guild, "queue");
        if (queue) this.queue = queue;
        if (message.guild.voiceConnection) {
            if (args.link[1] == "single") {
                this.addSingle(message, args, ID);
            }
            else {
                /**
                 * 
                 */
                this.addPlaylist(message, args, ID, (playlist)=>{
                    playlist.forEach((song, index, array)=>{
                        queue.push(song);
                    });
                });
            }
        }
        else {
            if (message.member.voiceChannel) {
                message.member.voiceChannel.join();
                if (args.link[1] == "single") {
                    this.addSingle(message, args, ID);
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
    async addSingle(message, args, ID) {
        await youtubeV3.videos.list({
            part: "snippet, contentDetails",
            id: ID
        }, (err, data) => {
            if (err) console.log(err);
            else {
                data.items.forEach(item => {
                    this.queue.push(this.song(message, args, item));
                });
                if(message.guild.voiceConnection.dispatcher) return;
                else this.play(message);
            }
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @param {*} ID 
     * @param {function(Array):void} [callback]
     * @returns {Array}
     */
    async addPlaylist(message, args, ID, callback) {
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
                                                    var playlist = [];
                                                    Data.forEach((songs, index) => {
                                                        songs.forEach((song, index) => {
                                                            playlist.push(song);
                                                        });
                                                    });
                                                    message.reply("Ok i added "+playlist.length+" songs to the queue");
                                                    // console.log(this.queue);
                                                    
                                                    if(callback) callback(playlist);
                                                    return playlist;
                                                    if(message.guild.voiceConnection.dispatcher) return playlist
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
    async play(message) {
        if (this.queue.length > 0) {
            var vid = this.queue[0]; 
            this.client.provider.set(message.guild, "queue", this.queue);
            this.client.provider.remove(message.guild, "nowPlaying");
            message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
            if (this.client.provider.get(message.guild, "volume") >= 0) message.guild.voiceConnection.dispatcher.setVolume(this.client.provider.get(message.guild, "volume"));
            else message.guild.voiceConnection.dispatcher.setVolume(0.3);
            message.channel.send("Now playing: "+vid.title);
            message.guild.voiceConnection.dispatcher.on("end", reason => {
                this.onEnd(message, reason);
            });
        }
    }
    async onEnd(message, reason) {
        console.log("File ended");
        if (this.client.provider.get(message.guild, "queue") && this.client.provider.get(message.guild, "queue").length > 1) {
            var queue = await this.client.provider.get(message.guild, "queue");
            if (reason && reason !== "!skip") {
                if (await this.client.provider.get(message.guild, "song", false)) {

                } else {
                    var vidold = queue.splice(0, 1)[0];
                    if (await this.client.provider.get(message.guild, "list", false)){
                        queue.push(vidold);
                    }
                }
            }
            else {
                var vidold = queue.splice(0, 1)[0];
                if (await this.client.provider.get(message.guild, "list", false)){
                    queue.push(vidold);
                }              
            }
            if(queue.length>0){
                var vid = queue[0];
                console.log(vid);
                message.guild.voiceConnection.playStream(ytdl(vid.ID, {filter: "audioonly"}));
                if (this.client.provider.get(message.guild, "volume") >= 0) message.guild.voiceConnection.dispatcher.setVolume(this.client.provider.get(message.guild, "volume"));
                else message.guild.voiceConnection.dispatcher.setVolume(0.3);
                message.channel.send("Now playing: "+vid.title);
                this.client.provider.set(message.guild, "queue", queue);
                this.client.provider.set(message.guild, "nowPlaying", vid);
                message.guild.voiceConnection.dispatcher.on("end", reason => {
                    if (reason) console.log(reason);
                    this.onEnd(message, reason);
                });
            }
            else {
                var empty = [];
                this.client.provider.set(message.guild, "queue", empty);
                console.log("queue is empty");
                return;
            }
        }
        else {
            var empty = [];
            this.client.provider.set(message.guild, "queue", empty);
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