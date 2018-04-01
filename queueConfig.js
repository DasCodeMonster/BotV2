const Song = require("./Song");

class QueueConfig {
    /**
     * 
     * @param {Song} nowPlaying 
     * @param {Song[]} queueArr 
     * @param {boolean} loopSong 
     * @param {boolean} loopList
     * @param {String} guildID 
     */
    // constructor(guildID, nowPlaying=null, queueArr=[], loopSong=false, loopList=false, volume=30){
    constructor(guildID, queueArr=[], loopSong=false, loopList=false, volume=30){        
        // this.nowPlaying = nowPlaying;
        this.queue = queueArr;
        this.loop = {song:loopSong, list:loopList};
        this.volume = volume;
        this.guildID = guildID;
    }
}
module.exports = QueueConfig;