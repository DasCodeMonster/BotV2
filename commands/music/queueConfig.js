const Song = require("./Song");

class QueueConfig {
    /**
     * 
     * @param {Song} nowPlaying 
     * @param {Song[]} queueArr 
     * @param {boolean} loopSong 
     * @param {boolean} loopList 
     */
    constructor(nowPlaying=null, queueArr=[], loopSong=false, loopList=false){
        this.nowPlaying = nowPlaying;
        this.queue = queueArr;
        this.loop = {song:loopSong, list:loopList};
    }
}
module.exports = QueueConfig;