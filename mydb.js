const mySQL = require("mysql");
const Connection = require("mysql/lib/Connection");

class myDB {
    constructor(host, user, password, dbname){
        this.connection = mySQL.createConnection({
            host: host,
            user: user,
            password: password
        });
        this.dbname = dbname;
    }
    connect(){
        var connection = new Promise((resolve, reject)=>{
            this.connection.connect((err, data)=>{
                if(err) reject(err);
                resolve(this.connection);
                console.info("Connected!");
            });
        });
        return connection;
    }
    async createDB(){
        /**
         * @type {Promise.<Connection>}
         */
        var connection = new Promise((resolve, reject)=>{
            this.connection.connect((err, data)=>{
                if(err) reject(err);
                
                resolve(this.connection);
                console.info("Connected!");
            });
        });
        var connectionvar =  await connection;
        if(!connectionvar) throw new Error("WTF");
        var data = new Promise((resolve, reject)=>{
            this.connection.query("CREATE DATABASE IF NOT EXISTS ??", [this.dbname], (err, data)=>{
                if(err) reject(err);
                // console.log(data);
                resolve(data);
            });
        });
        var datavar = await data;
        var end = new Promise((resolve, reject)=>{
            this.connection.end((err, data)=>{
                if(err) reject(err);
                resolve(data);
            });
        });
        var endvar = await end;
        if(!endvar) throw new Error("WTF");
        var host = this.connection.config.host;
        var user = this.connection.config.user;
        var password = this.connection.config.password;
        this.connection = mySQL.createConnection({
            host: host,
            user: user,
            password: password,
            database: this.dbname
        });
        return this.connection;
    }
}
module.exports = myDB;