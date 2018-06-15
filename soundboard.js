const {TextChannel, MessageEmbed} = require("discord.js");
const FileHandler = require("./filehandler");

class SoundBoard {
    /**
     * 
     * @param {FileHandler} fileHandler 
     */
    constructor(fileHandler){
        this.sounds = new Map();
        this.fileHandler = fileHandler;
        // fileHandler.database.on("");
    }
    /**
     * 
     * @param {str} id 
     */
    async _load(id){
        let entries = await this.fileHandler.getAll(id);
        console.log(entries);
        entries.forEach((sound, index)=>{
            this.sounds.set(sound.id, sound);
        });
    }
    /**
     * 
     * @param {TextChannel} channel 
     */
    async sendMessage(channel){
        
    }
}
module.exports = SoundBoard;