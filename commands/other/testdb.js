const commando = require("discord.js-commando");
const Connection = require("mysql/lib/Connection");

class testDB extends commando.Command {
    constructor(client) {
        super(client, {
            name: "db",
            group: "other",
            memberName: "db",
            description: "db",
            guildOnly: false
        });
    }
    async run(msg){
        /**
         * @type {Connection}
         */
        const connection = this.client.mydb;
        var table = new Promise((resolve, reject)=>{
            // connection.query("CREATE TABLE test (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), address VARCHAR(255))", (err, data)=>{
            // connection.query("INSERT INTO test (name, address) VALUES ('Company Inc', 'Highway 37')", (err, data)=>{
            // connection.query("SELECT * FROM test", (err, data)=>{
            connection.query("SELECT * FROM information_schema.tables WHERE table_schema = 'asdasd' AND table_name = 'test' LIMIT 1;", (err, data)=>{
                if(err) reject(err);
                // console.log(data);
                resolve(data);
                // console.info("created Table");
            });
        });
        var res = await table
        if (res.length > 0){
            
        }
        console.log(res);
    }
}
module.exports = testDB