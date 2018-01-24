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
            this.connection.query("SELECT * FROM information_schema.tables WHERE table_schema = ?? AND table_name = ?? LIMIT 1;",[this.connection.config.database, "lyrics"], (err, data)=>{
                if(err) reject(err);
                resolve(data);
            });
        });
        var existsres = await exists;
        if (existsres.length === 0) {
            var create = new Promise((resolve, reject)=>{
                this.connection.query("CREATE TABLE Songs (title VARCHAR(255), author VARCHAR(255), lyrics TEXT)", (err, data)=>{
                    if (err) reject(err);
                    resolve(data);
                });
            })
            var createres = await create;
            if (!createres) throw new Error("WTF");
        }
    }
}