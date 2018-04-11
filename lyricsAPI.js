const {Collection} = require("discord.js");
const sqlite = require("sqlite");
const Lyrics = require("./lyrics");
const Sifter = require("sifter");
const YT = require("./ytsong");
const {EventEmitter} = require("events");
const colors = require("colors");
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
        this.on("error", error=>{
            console.error("%s".error, error);
        });
    }
    async init(){
        try{
        this.db = await sqlite.open("lyrics.sqlite", {promise: Promise});
        await this.db.run('CREATE TABLE IF NOT EXISTS lyrics (id INTEGER, author TEXT NOT NULL, title TEXT NOT NULL, lyrics TEXT NOT NULL, genre TEXT, ytids TEXT)');
        var dataj = await this.db.all("SELECT * FROM lyrics");
        if (dataj.length !== 0){
            dataj.forEach((val, index, array)=>{
                this.lyrics.set(Number.parseInt(val.id), new Lyrics(Number.parseInt(val.id), val.author, val.title, val.lyrics, val.genre, JSON.parse(val.ytids)));
            });
        }
        this.emit(this.events.ready);
        }catch(e){
            console.log(e);
        }
    }
    /**
     * Adds a song to the database
     * @param {String} title Name of the song
     * @param {String} author original interpret of the song
     * @param {String} lyrics lyrics of the song
     * @param {String} genre Genre of the song
     * @param {String[]} ytids Youtube Links of the song
     */
    async add(author, title, lyrics, genre=null, ytids=[]){
        await this.db.run('INSERT OR REPLACE INTO lyrics(id, author, title, lyrics, genre, ytids) VALUES(?, ?, ?, ?, ?, ?)', this.lyrics.size+1, author, title, lyrics, genre, JSON.stringify(ytids));
        this.lyrics.set(this.lyrics.size+1, new Lyrics(this.lyrics.size+1, author, title, lyrics, genre, ytids));
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
     * @returns {Lyrics[]}
     */
    searchTitle(title){
        var searchArray = new Sifter(this.lyrics.array());
        var result = searchArray.search(title, {
            fields: ["title"],
            sort: [{field: "title", direction: "asc"}],
            limit: 5});
        var resArr = [];
        result.items.forEach((val, index, array)=>{
            resArr.push(this.lyrics.get(val.id+1));
        });
        return resArr;
    }
    /**
     * 
     * @param {String} author 
     */
    searchAuthor(author){
        var searchArray = new Sifter(this.lyrics.array());
        var result = searchArray.search(author, {
            fields: ["author"],
            sort: [{field: "author", direction: "asc"}],
        limit: 5});
        var resArr = [];
        result.items.forEach((val, index, array)=>{
            resArr.push(this.lyrics.get(val.id+1));
        });
        return resArr;
    }
    /**
     * 
     * @param {String} genre 
     */
    searchGenre(genre){
        var searchArray = new Sifter(this.lyrics.array());
        var result = searchArray.search(genre, {
            fields: ["genre"],
            sort: [{field: "genre", direction: "asc"}],
        limit: 5});
        var resArr = [];
        result.items.forEach((val, index, array)=>{
            resArr.push(this.lyrics.get(val.id+1));
        });
        return resArr;
    }
    /**
     * 
     * @param {Number} id 
     */
    searchId(id){
        return this.lyrics.filterArray((lyrics, key, collection)=>{
            return lyrics.id === id;
        });
    }
    searchLyrics(text){
        var searchArray = new Sifter(this.lyrics.array());
        var result = searchArray.search(text, {
            fields: ["lyrics"],
            sort: [{field: "lyrics", direction: "asc"}],
        limit: 5});
        var resArr = [];
        result.items.forEach((val, index, array)=>{
            resArr.push(this.lyrics.get(val.id+1));
        });
        return resArr;
    }
    /**
     * 
     * @param {String} link 
     */
    searchYTID(id){
        return this.lyrics.filterArray((lyric, key, coll)=>{
            return lyric.links.includes(id);
        });
    }
    async getAll(){
        return this.lyrics.array();
    }
    async close(){
        await this.db.close();
        console.info("Closed lyrics db".info);
    }
}
module.exports = LyricsAPI;