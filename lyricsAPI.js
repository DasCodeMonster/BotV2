const {Collection} = require("discord.js");
const sqlite = require("sqlite");
const Lyrics = require("./lyrics");
const colors = require("colors");
const Sifter = require("sifter");
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
    async remove(id){
        await this.db.run('DELETE FROM lyrics WHERE id=?', id);
        this.lyrics.delete(id);
        /**
         * @type {Collection<Number,Lyrics>}
         */
        var toUpdate = new Collection();
        var temp = 0;
        this.lyrics.forEach((lyrics, key, map)=>{
            if(key !== temp+1){
                lyrics.id = temp+1;
                toUpdate.set(lyrics.id, lyrics);
                this.db.run("UPDATE lyrics SET id=? WHERE id=?", lyrics.id, key);
                this.lyrics.delete(key);
            }
            temp += 1;
        });
        this.lyrics = this.lyrics.concat(toUpdate);
        console.log(this.lyrics);
        console.log(await this.db.run("SELECT * from lyrics"));
    }
    async edit(){

    }
    /**
     * 
     * @param {String} title Searchquerry
     */
    searchTitle(title){
        var searchArray = new Sifter(this.lyrics.array());
        var result = searchArray.search(title, {
            fields: ["title"],
            sort: [{field: "title", direction: "asc"}],
        limit: 5});
        console.log(result);
        var resArr = [];
        result.items.forEach((val, index, array)=>{
            resArr.push(this.lyrics.get(val.id+1));
        });
        console.log(resArr);
        return resArr;
         return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.title.match(title) || lyrics.title.includes(title) || lyrics.title.toLowerCase().includes(title) || lyrics.title.includes(title.toLowerCase());
        });
    }
    /**
     * 
     * @param {String} author 
     */
    searchAuthor(author){
        return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.author.match(author) || lyrics.author.includes(author) || lyrics.title.toLowerCase().includes(author) || lyrics.title.includes(author.toLowerCase());
        });
    }
    /**
     * 
     * @param {String} genre 
     */
    searchGenre(genre){
        return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.genre.match(genre) || lyrics.genre.includes(genre) || lyrics.title.toLowerCase().includes(genre) || lyrics.title.includes(genre.toLowerCase());
        });
    }
    /**
     * 
     * @param {Number} id 
     */
    searchId(id){
        return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.id ===id;
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