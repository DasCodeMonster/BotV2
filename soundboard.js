const {TextChannel, MessageEmbed, GuildChannel, Client, Collection, ReactionCollector, Message, Util} = require("discord.js");
const FileHandler = require("./filehandler");

/**
 * @typedef {Object} Sound
 * @property {string} id
 * @property {string} fileobject
 * @property {string} author
 * @property {string} timestamp
 * @property {string} guildid
 */
class SoundBoard {
    /**
     * 
     * @param {FileHandler} fileHandler 
     * @param {Client} client
     * @param {string} id
     */
    constructor(fileHandler, client, id){
        this.id = id;
        /**
         * @type {Collection<string, Sound>}
         */
        this.sounds = new Collection();
        this.fileHandler = fileHandler;
        fileHandler.on("update", async ()=>{
            this._load(id);
        });
        this.client = client;
        /**
         * @type {Message}
         */
        this.message = null;
        /**
         * @type {ReactionCollector}
         */
        this.collector = null;
        this.reactions = [];
        this.page = 1;
        /**
         * @type {Map<number,string>}
         */
        this.pages = new Map();
    }
    async _update(){
        this._pages();
        if(this.message !== null){
            await this.react();
            let embed = await this.makeEmbed();
            this.message.edit(embed);
        }
    }
    /**
     * 
     * @param {string} id 
     */
    async _load(){
        /**
         * @type {Sound[]}
         */
        let all = await this.fileHandler.getAllByID(this.id);
        /**
         * @type {Collection<string, Sound>}
         */
        let newMap = new Collection();
        all.forEach(sound=>{
            newMap.set(sound.id, sound);
        });
        console.log(!newMap.equals(this.sounds));
        if(!newMap.equals(this.sounds)){
            this.sounds = newMap;
            this._update();
        }
    }
    /**
     * 
     * @param {TextChannel & GuildChannel} channel 
     */
    async sendMessage(channel){
        // if(this.message !== null) this.collector.stop("New Handler");
        let embed = await this.makeEmbed(channel.guild.id);
        this.message = await channel.send(embed);
        await this._handle();
    }
    async makeEmbed(){
        if(this.message === null) await this._load(this.id);
        let embed = new MessageEmbed()
            .setColor(666)
            .setTimestamp(new Date())
            .setTitle("Soundboard");
        if(this.sounds.size > 0){
            let soundString = "```";
            let index = 1;
            const section1 = 17;
            this.sounds.forEach(sound=>{
                let member = this.client.guilds.get(this.id).member(sound.author)?this.client.guilds.get(this.id).member(sound.author).user.username:this.client.user.username;
                if(member.length > 13){
                    member = member.substr(0, 10) + "...";
                }
                soundString += `${index++}: ${sound.id}`;
                for (let i = 0; i < section1 - sound.id.length; i++) {
                    soundString += " ";
                }
                soundString += `| ${sound.timestamp.substr(0, 16)} | ${this.client.guilds.get(this.id).member(sound.author)?this.client.guilds.get(this.id).member(sound.author).user.username:this.client.user.username}\n`;
            });
            soundString += "```";
            embed.addField("Sounds:", soundString);
        }else{
            embed.addField("Sounds:", "This soundboard is empty");
        }
        return embed;
    }
    _pages(){
        let newPages = new Map();
        let index = 1;
        const section1 = 17;
        let lines = [];
        this.sounds.forEach(sound=>{
            let member = this.client.guilds.get(this.id).member(sound.author)?this.client.guilds.get(this.id).member(sound.author).user.username:this.client.user.username;
            if(member.length > 13){
                member = member.substr(0, 10) + "...";
            }
            let line = "";
            line += `${index++}: ${sound.id}`;
            for (let i = 0; i < section1 - sound.id.length; i++) {
                line += " ";
            }
            line += `| ${sound.timestamp.substr(0, 16)} | ${this.client.guilds.get(this.id).member(sound.author)?this.client.guilds.get(this.id).member(sound.author).user.username:this.client.user.username}\n`;
            lines.push(line);
        });
        let soundString = "```";
        lines.forEach((line, index)=>{
            soundString += line;
            if((index % 10) === 0){
                soundString += "```";
                newPages.set(this.pages.size+1, soundString);
                soundString = "```";
            }
        });
        if(soundString.length > 3){
            soundString += "```";
            newPages.set(this.pages.size+1, soundString);
        }
        this.pages = newPages;
    }
    async _handle(){
        await this.react();
        this.Collector = new ReactionCollector(this.message,
            /**
             * @param {MessageReaction} reaction
             * @param {User} user
             * @param {Collection} collection
             */
            (reaction, user, collection)=>{
                if(user.id === this.client.user.id) return false;
                reaction.users.remove(user);
                if(!this.reactions.includes(reaction.emoji.name)) return false;
                return true;
            });
        this.Collector.on("collect", (reaction, user)=>{
            if(["◀", "▶"].includes(reaction.emoji.name)){
                if(reaction.emoji.name === "◀"){
                    if(this.page-1 > 0) this.page-1;
                    else this.page = this.pages.size;
                }else {
                    if(this.page+1 <= this.pages.size) this.page+1;
                    else this.page = 1;
                }
            }else{
                this.emit(reaction.emoji.name, user);
            }
        });
        this.Collector.on("error", e=>{
            console.log(e);
        });
        this.Collector.on("end", (_, reason)=>{
            console.log(reason);
        });
    }
    async react(){
        try {
            if(!this.message) throw new Error("Use #sendMessage() first!");
            const nums = ["1⃣", "2⃣", "3⃣", "4⃣", "5⃣", "6⃣","7⃣","8⃣","9⃣","🔟"];
            let reactions = [];
            if(this.pages.get(this.page) && this.pages.get(this.page).split("\n").length < 10){
                for (let i = 0; i < this.pages.get(this.page).split("\n").length; i++) {
                    reactions.push(nums[i]);
                }
            }
            if(this.pages.size > 1){
                reactions.push("◀");
                reactions.push("▶");
            }
            if(ArrayEqual(reactions, this.reactions) && ArrayEqual(this.message.reactions.map(reaction=>reaction.emoji.name), reactions)) return;
            this.reactions = reactions;
            await this.message.reactions.removeAll();
            asyncForEach(reactions, async name=>{
                await this.message.react(name);
            });
        } catch (error) {
            console.log(error);
        }
    }
}
module.exports = SoundBoard;

/**
 * 
 * @param {Array} arr1 
 * @param {Array} arr2 
 */
function ArrayEqual(arr1, arr2) {
    let length = arr1.length;
    if (length !== arr2.length) return false;
    for (var i = 0; i < length; i++)
        if (arr1[i] !== arr2[i])
            return false;
    return true;
}

/**
 * 
 * @param {Array} array 
 * @param {function(*, Number, Array)} callback 
 */
async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}