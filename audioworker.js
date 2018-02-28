const {Collection, Message, Guild} = require("discord.js");
const QueueConfig = require("./queueConfig");
const Queue = require("./myQueue");
const colors = require("colors");
const sqlite = require("sqlite");

colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});
class Audioworker {
    /**
     * 
     * @param {Collection<String, QueueConfig>} queueConfigs 
     */
    constructor(client, intervall=60000){
        /**
         * @type {Collection<String, Queue>}
         */
        this.queues = new Collection();
        this.intervall = intervall;
        this.init();
        this.db;
    }
    /**
     * Add a queue for a guild to the audioworker
     * @param {Guild} guild 
     */
    add(guild){
        var coll = this.queues.set(guild.id, new Queue(new QueueConfig()));
        return coll.get(guild.id);
    }
    /**
     * 
     * @param {Function} callback 
     */
    async init(){
        this.db = await sqlite.open("audio.sqlite", {promise: Promise});
        await this.db.run('CREATE TABLE IF NOT EXISTS audio (id INTEGER PRIMARY KEY, settings TEXT)');
        var dataj = await this.db.all("SELECT settings FROM audio");
        if (dataj.length !== 0){
            var data = JSON.parse(dataj[0].settings);
            data.forEach((arrayj, index, originalarr)=>{
                this.queues.set(arrayj[0], new Queue(arrayj[1]));
            });
        }
        setInterval(async (queues, db)=>{
            /** 
             * @type {Collection<String, QueueConfig>}
             */
            var saveCollection = new Collection();
            queues.forEach((queue, key, map)=>{
               let save = queue.save();
               saveCollection.set(key, save);
            });
            var savedata = [];
            saveCollection.forEach((config, key, map)=>{
                savedata.push([key, config]);
            });
            var savedataj = JSON.stringify(savedata);
            await db.run('INSERT OR REPLACE INTO audio VALUES(?, ?)', 1, savedataj);
        }, this.intervall, this.queues, this.db);
    }
    async close(){
        await this.db.close();
        console.info("Closed audioworker db".info);
    }
}
module.exports = Audioworker;