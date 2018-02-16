const discord = require("discord.js");
const Collection = discord.Collection;
const Commando = require('discord.js-commando');
const time = require("node-datetime");
const path = require('path');
const sqlite = require('sqlite');
const keys = require('./Token&Keys');
const myDB = require("./mydb");
const Connection = require("mysql/lib/Connection");
const Lyrics = require("./lyrics");
const colors = require("colors");
const util = require("util");
const Audioworker = require("./audioworker");
const QueueConfig = require("./commands/music/queueConfig");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});
const client = new Commando.Client({
    owner: keys.OwnerID,
    unknownCommandResponse: false,
});
process.title = "MyBotV2";
client.registry.registerGroup("music", "Music commands");
client.registry.registerGroup("fun", "Fun commands");
client.registry.registerGroup("other", "other commands");
client.registry.registerGroup("points", "Commands related to your points");
client.registry.registerGroup("generic", "Generic commands");
client.registry.registerGroup("test", "only for testing");
client.registry.registerDefaults();
client.registry.registerType("option");
client.registry.registerType("search");
//client.registry.registerType("role_or_user_or_channel");
//client.registry.registerType("commandname");
// client.registry.registerType("song_or_list");
// client.registry.registerType("optionalbool");
// client.registry.registerType("commandgroup");
// client.registry.registerType("command");
client.registry.registerType("ytlink");
client.registry.registerTypesIn(path.join(__dirname, "Types"));
client.registry.registerCommandsIn(path.join(__dirname, 'commands'));
client.setProvider(
    sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db => new Commando.SQLiteProvider(db))
).catch(console.error);
var con = new myDB(keys.database.host, keys.database.user, keys.database.password, keys.database.name);
/**
 * @type {Connection}
 */
async function test(){
    client.mydb = await con.createDB();
    var exists = new Promise((resolve, reject)=>{
        this.connection.query("SELECT * FROM information_schema.tables WHERE table_schema = ?? AND table_name = ?? LIMIT 1;",[client.mydb.config.database, "test"], (err, data)=>{
            if(err) reject(err);
            resolve(data);
        });
    });
    var existsres = await exists;
    if (existsres.length === 0) {
        var create = new Promise((resolve, reject)=>{
            this.connection.query("CREATE TABLE test (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), address VARCHAR(255))", (err, data)=>{
                if (err) reject(err);
                resolve(data);
            });
        });
        var createres = await create;
        if (!createres) throw new Error("WTF");
    }
    var lyrics = new Lyrics(client.mydb);
    client.lyrics = await lyrics.init();
}
//test();
async function setAudioworker(){
    // /** 
    //  * @type {Collection<String, QueueConfig>}
    // */
    // var savedaudioworker = await client.provider.get("global", "Audioworker", new Collection());
    // console.log(savedaudioworker);
    client.Audioworker = new Audioworker(client, 60000);
    /** 
     * @type {Promise.<Boolean>}
    */
    var start = new Promise((resolve, reject)=>{
        client.Audioworker.init((boolean)=>{
            resolve(boolean);
        });
    });
}
function helperfunc(boolean){
    resolve(boolean);
}
client.on("ready", () => {
    /*process.send({
        "message":"ready"
    });*/
    // setAudioworker();
    client.Audioworker = new Audioworker(client, 60000);
    client.Audioworker.init();
    console.info(colors.info("bot startet"));
    function repeatEvery(func, interval) {
        // Check current time and calculate the delay until next interval
        var now = new Date(),
            delay = interval - now % interval;
        console.debug(colors.debug(now));
        console.debug(colors.debug(now%interval));
        console.debug(colors.debug(delay));
        function start() {
            // Execute function now...
            func();
            // ... and every interval
            setInterval(func, interval);
        }    
        // Delay execution until it's an even interval
    }
    repeatEvery(() => {
        console.debug(colors.debug(time.create().format("H:M:S")));
        client.guilds.array().forEach(Guild => {
            Guild.members.array().forEach(member => {
                if (member.user.presence.status != "online") return;
                if (client.provider.get(Guild, member.id)) var points = client.provider.get(Guild, member.id);
                else var points = 0;
                client.provider.set(Guild, member.id, points+10);
            });
        });
    }, 200000);
});
client.on("channelCreate", channel => {
    
});
client.on("channelDelete", channel => {
    
});
client.on("channelPinsUpdate", (channel, time) => {

});
client.on("channelUpdate", (oldChannel, newChannel) => {

});
client.on("clientUserSettingsUpdate", clientUserSettings => {

});
client.on("debug", info => {

});
client.on("disconnect", event => {

});
client.on("emojiCreate", emoji => {

});
client.on("emojiDelete", emoji => {

});
client.on("emojiUpdate", (oldEmoji, newEmoji) => {

});
client.on("error", error => {

});
client.on("guildBanAdd", (guild, user) => {

});
client.on("guildBanRemove", (guild, user) => {
    
});
client.on("guildCreate", Guild => {
    console.info(colors.info("Serving now Guild with name: "+Guild.name));
    
});
client.on("guildDelete", Guild => {
    console.info(colors.info("Not serving anymore Guild with name: "+ Guild.name));
});
client.on("guildMemberAdd", member => {

});
client.on("guildMemberAvailable", member => {

});
client.on("guildMemberRemove", member => {

});
client.on("guildMembersChunk", (members, guild) => {

});
client.on("guildMemberSpeaking", (member, speaking) => {

});
client.on("guildMemberUpdate", (oldMember, newMember) => {

});
client.on("guildUnavailable", guild => {
    
});
client.on("guildUpdate", (oldGuild, newGuild) => {

});
client.on("message", async message => {
    if (message.author.bot) return;
});
client.on("messageDelete", async message => {
    
});
client.on("messageDeleteBulk", messages => {

});
client.on("messageReactionAdd", (messageReaction, user) => {

});
client.on("messageReactionRemove", (messageReaction, user) => {

});
client.on("messageReactionRemoveAll", message => {

});
client.on("messageUpdate", (oldMessage, newMessage) => {

});
client.on("presenceUpdate", (oldMember, newMember) => {

});
client.on("reconnecting", () => {

});
client.on("roleCreate", role => {

});
client.on("roleDelete", role => {

});
client.on("roleUpdate", (oldRole, newRole) => {

});
client.on("typingStart", (channel, user) => {

});
client.on("typingStop", (channel, user) => {

});
client.on("userNoteUpdate", (user, oldNote, newNote) => {

});
client.on("userUpdate", (oldUser, newUser) => {

});
client.on("voiceStateUpdate", (oldMember, newMember) => {

});
client.on("warn", info => {
    console.warn("%s".warn, info);
});
console.info(colors.info("bot is logging in..."));
client.login(keys.BotToken).catch(console.error);
console.info(colors.info("bot is logged in"));

process.once('SIGINT', () => {
    console.info(colors.info("exiting now"));
    client.destroy();
    process.exit(0);
});
process.on('unhandledRejection', (reason, p) => {
    console.error("Unhandled Rejection at:".error);
    console.error("%s".error, util.inspect(p));
    console.error("reason:".error);
    console.error("%s".error, util.inspect(reason));
  });
process.on('warning', (warning) => {
    console.warn(colors.warn(warning.name));    // Print the warning name
    console.warn(colors.warn(warning.message)); // Print the warning message
    console.warn(colors.warn(warning.stack));   // Print the stack trace
});