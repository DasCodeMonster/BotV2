const {Collection, Client} = require("discord.js");
const {CommandoClient, SQLiteProvider} = require('discord.js-commando');
// const time = require("node-datetime");
const path = require('path');
const sqlite = require('sqlite');
const keys = require('./Token&Keys');
const Lyrics = require("./lyrics");
const util = require("util");
const Audioworker = require("./audioworker");
const LyricsAPI = require("./lyricsAPI");
const colors = require("colors");
const Logger = require("./logger");
const PermissionManager = require("./permissionManager");
const {BotToken, OwnerID, YoutubeAPIKey} = require("./tokens");
const VoiceClient = require("./VoiceClient");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});
// /**
//  * @type {Client}
//  */
const client = new VoiceClient({
    owner: OwnerID,
    unknownCommandResponse: false
}, YoutubeAPIKey);
process.title = "MyBotV2";
client.registry.registerGroup("music", "Music commands");
// client.registry.registerGroup("fun", "Fun commands");
client.registry.registerGroup("other", "other commands");
client.registry.registerGroup("points", "Commands related to your points");
client.registry.registerGroup("generic", "Generic commands");
client.registry.registerGroup("test", "only for testing");
client.registry.registerDefaults();
// client.registry.registerType("option");
// client.registry.registerType("search");
//client.registry.registerType("role_or_user_or_channel");
//client.registry.registerType("commandname");
// client.registry.registerType("song_or_list");
// client.registry.registerType("optionalbool");
// client.registry.registerType("commandgroup");
// client.registry.registerType("command");
// client.registry.registerType("ytlink");
client.registry.registerTypesIn(path.join(__dirname, "Types"));
client.registry.registerCommandsIn(path.join(__dirname, 'commands'));
client.setProvider(
    sqlite.open(path.join(__dirname, 'settings.sqlite3')).then(db => new SQLiteProvider(db))
).catch(console.error);
client.dispatcher.addInhibitor(msg=>{
    // if(msg.author.id === "221047590681051152") return "Test!"
});

client.on("ready", () => {
    try{
        console.info(colors.info("Bot started"));
    }catch(e){
        console.log(e);
    }
    // function repeatEvery(func, interval) {
    //     // Check current time and calculate the delay until next interval
    //     var now = new Date(),
    //         delay = interval - now % interval;
    //     console.debug(colors.debug(now));
    //     console.debug(colors.debug(now%interval));
    //     console.debug(colors.debug(delay));
    //     function start() {
    //         // Execute function now...
    //         func();
    //         // ... and every interval
    //         setInterval(func, interval);
    //     }    
    //     // Delay execution until it's an even interval
    // }
    // repeatEvery(() => {
    //     console.debug(colors.debug(time.create().format("H:M:S")));
    //     client.guilds.array().forEach(Guild => {
    //         Guild.members.array().forEach(member => {
    //             if (member.user.presence.status !== "online") return;
    //             if (client.provider.get(Guild, member.id)) var points = client.provider.get(Guild, member.id);
    //             else var points = 0;
    //             client.provider.set(Guild, member.id, points+10);
    //         });
    //     });
    // }, 200000);
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
    // console.log(info);
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
    console.error("%s".error, error);
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
client.login(BotToken).catch(console.error);
console.info(colors.info("bot is logged in"));

process.once('SIGINT', () => {
    console.info(colors.info("exiting now"));
    // client.Audioworker.close();
    // client.LyricsAPI.close();
    client.destroy();
    process.exit(0);
});
process.on("uncaughtException", (error)=>{
    console.error(error);
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