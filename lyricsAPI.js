const {Collection} = require("discord.js");
const sqlite = require("sqlite");
const Lyrics = require("./lyrics");
const colors = require("colors");
const {EventEmitter} = require("events");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});

class LyricsAPI extends EventEmitter {
    constructor(){
        super();
        /**
         * @type {Collection<Number,Lyrics>}
         */
        this.lyrics = new Collection();
        this.db;
        this.events = {ready: "ready"}
        this.init();
    }
    async init(){
        this.db = await sqlite.open("lyrics.sqlite", {promise: Promise});
        await this.db.run('CREATE TABLE IF NOT EXISTS lyrics (id INTEGER, author TEXT NOT NULL, title TEXT, lyrics TEXT NOT NULL, genre TEXT, links TEXT)');
        var dataj = await this.db.all("SELECT * FROM lyrics");
        if (dataj.length !== 0){
            dataj.forEach((val, index, array)=>{
                this.lyrics.set(Number.parseInt(val.id), new Lyrics(Number.parseInt(val.id), val.author, val.title, val.lyrics, val.genre, JSON.parse(val.links)));
            });
        }
        this.emit(this.events.ready);
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
    /**
     * 
     * @param {String} title Searchquerry
     */
    searchTitle(title){
         return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.title.includes(title) //|| lyrics.title.toLowerCase().includes(title) || lyrics.title.includes(title.toLowerCase());
        });
    }
    searchAuthor(author){
        return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.author.includes(author) || lyrics.title.toLocaleLowerCase().includes(title) || lyrics.title.includes(title.toLocaleLowerCase());
        });
    }
    searchGenre(genre){
        return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.genre.includes(genre) || lyrics.title.toLocaleLowerCase().includes(title) || lyrics.title.includes(title.toLocaleLowerCase());
        });
    }
    searchId(id){
        return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.id.includes(id) || lyrics.title.toLocaleLowerCase().includes(title) || lyrics.title.includes(title.toLocaleLowerCase());
        });
    }
    // searchLink(link){
    //     return this.lyrics.findAll("link", link);
    // }
    async getAll(){
        return this.lyrics.array();
    }
    async close(){
        await this.db.close();
        console.info("Closed lyrics db".info);
    }
}
module.exports = LyricsAPI;