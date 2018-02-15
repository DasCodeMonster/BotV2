const {Collection, Message, Guild} = require("discord.js");
const QueueConfig = require("./commands/music/queueConfig");
const Queue = require("./commands/music/myQueue");
const colors = require("colors");

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
    constructor(client, intervall=60000, queueConfigs){
        /**
         * @type {Collection<String, Queue>}
         */
        this.queues = new Collection();
        console.log(queueConfigs);
        this.queueConfigs = queueConfigs;
        this.queueConfigs.forEach((queueConfig, key, map)=>{
            this.queues.set(key, new Queue(queueConfig));  
        });
        console.log(this.queues);
        this.intervall = intervall;
        this.client = client
        setInterval(async (queues, provider)=>{
            /** 
             * @type {Collection<String, QueueConfig>}
            */
            var saveCollection = new Collection();
            queues.forEach((queue, key, map)=>{
                let save = queue.save();
                saveCollection.set(key, save);
            });
            await this.client.provider.set("global", "Audioworker", saveCollection);
            var debug = await this.client.provider.get("global", "Audioworker");
            console.log(debug);
            console.debug("Saved Audioworker".debug);
        }, this.intervall, this.queues, client.provider);
        console.info("Successfully set Audioworker".info);
    }
    /**
     * Add a queue for a guild to the audioworker
     * @param {Guild} guild 
     */
    add(guild){
        var coll = this.queues.set(guild.id, new Queue(new QueueConfig()));
        return coll.get(guild.id);
    }
}
module.exports = Audioworker;