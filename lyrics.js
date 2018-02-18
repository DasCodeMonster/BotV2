
class Lyrics {
    /**
     * 
     * @param {Number} id
     * @param {String} author Name of the author
     * @param {String} title Name of the song
     * @param {String} lyrics The lyrics to the song if no lyrics provide "<instrumental>"
     * @param {String} genre Genre of the song
     * @param {String[]} links Youtube links of this song with matching lyrics
     */
    constructor(id, author, title, lyrics, genre=null, links=[]){
        this.id = id;
        this.author = author;
        this.title = title;
        this.lyrics = lyrics;
        this.genre = genre;
        this.links = links;
    }
}
module.exports = Lyrics;