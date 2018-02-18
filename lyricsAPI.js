const {Collection} = require("discord.js");
const sqlite = require("sqlite");
const Lyrics = require("./lyrics");
const colors = require("colors");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});

class LyricsAPI {
    constructor(){
        this.lyrics = new Collection();
        this.db;
        this.init();
    }
    async init(){
        this.db = await sqlite.open("lyrics.sqlite", {promise: Promise});
        await this.db.run('CREATE TABLE IF NOT EXISTS lyrics (id INTEGER, author TEXT NOT NULL, title TEXT, lyrics TEXT NOT NULL, genre TEXT, links TEXT)');
        var dataj = await this.db.all("SELECT * FROM lyrics");
        if (dataj.length !== 0){
            dataj.forEach((val, index, array)=>{
                this.lyrics.set(val.id, new Lyrics(JSON.parse(val.id), val.author, val.title, val.lyrics, val.genre, JSON.parse(val.links)));
            });
        }
    }
    /**
     * Adds a song to the database
     * @param {String} title Name of the song
     * @param {String} author original interpret of the song
     * @param {String} lyrics lyrics of the song
     * @param {String} genre Genre of the song
     * @param {String[]} links Youtube Links of the song
     */
    async add(author, title, lyrics, genre=null, links=[]){
        await this.db.run('INSERT OR REPLACE INTO lyrics(id, author, title, lyrics, genre, links) VALUES(?, ?, ?, ?, ?, ?)', this.lyrics.size+1, author, title, lyrics, genre, JSON.stringify(links));
        this.lyrics.set(this.lyrics.size+1, new Lyrics(this.lyrics.size+1, author, title, lyrics, genre, links));
    }
    async remove(){

    }
    async edit(){

    }
    searchTitle(title){
        return this.lyrics.findAll("title", title);
    }
    searchAuthor(author){
        return this.lyrics.findAll("author", author);
    }
    searchGenre(genre){
        return this.lyrics.findAll("genre", genre);
    }
    searchId(id){
        return this.lyrics.findAll("id", id);
    }
    // searchLink(link){
    //     return this.lyrics.findAll("link", link);
    // }
    async getAll(){

    }
    async close(){
        await this.db.close();
        console.info("Closed lyrics db".info);
    }
}
module.exports = LyricsAPI;