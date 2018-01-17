class Song {
    /**
     * 
     * @param {String} ID 
     * @param {String} title 
     * @param {String} description 
     * @param {String} author 
     * @param {Number} length 
     * @param {*} queuedBy 
     */
    constructor(ID, title, description, author, channelID, length, thumbnailURL, tWidth, tHeight, queuedBy) {
        this.ID = ID;
        this.title = title,
        this.description = description,
        this.author = author;
        this.channelID = channelID
        this.length = length;
        this.thumbnailURL = thumbnailURL;
        this.tWidth = tWidth;
        this.tHeight = tHeight;
        this.queuedBy = queuedBy;
        this.queuedAt = new Date().toString();
    }
}
module.exports = Song;