const Connection = require("mysql/lib/Connection");

class Lyrics {
    /**
     * 
     * @param {Connection} connection 
     */
    constructor(connection){
        this.connection = connection;
    }
    async init(){
        var exists = new Promise((resolve, reject)=>{
            this.connection.query("SELECT * FROM information_schema.tables WHERE table_schema = ?? AND table_name = ?? LIMIT 1;",[this.connection.config.database, "songs"], (err, data)=>{
                if(err) reject(err);
                resolve(data);
            });
        });
        var existsres = await exists;
        if (existsres.length === 0) {
            var create = new Promise((resolve, reject)=>{
                this.connection.query("CREATE TABLE songs (id INT AUTO_INCREMENT PRIMARY KEY, title VARCHAR(255), author VARCHAR(255), lyrics TEXT)", (err, data)=>{
                    if (err) reject(err);
                    resolve(data);
                });
            });
            var createres = await create;
            if (!createres) throw new Error("WTF");
        }
    }
    /**
     * Adds a song to the database
     * @param {String} title Name of the song
     * @param {String} author original interpret of the song
     * @param {String} lyrics lyrics of the song
     */
    async add(title, author, lyrics){
        var addP = new Promise((resolve, reject)=>{
            this.connection.query("INSERT INTO songs (title, author, lyrics) VALUES ?", [[title, author, lyrics]], (err, data)=>{
                if(err) reject(err);
                resolve(data);
            });
        });
        var add = await addP;
        if(!add) throw new Error("WTF");
        console.log(add);
        return add;
    }
    async remove(){

    }
    async edit(){

    }
    async search(){

    }
    async getAll(){

    }
}
module.exports = Lyrics;