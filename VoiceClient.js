const {CommandoClient} = require("discord.js-commando");
const {Collection, Clie} = require("discord.js");
const LyricsAPI = require("./lyricsAPI");
const VoiceModule = require("./VoiceModule");
const Logger = require("./logger");
const Youtube = require("./youtube");

/**
 * Options for a client.
 * @typedef {Object} ClientOptions
 * @property {string} [apiRequestMethod='sequential'] One of `sequential` or `burst`. The sequential handler executes
 * all requests in the order they are triggered, whereas the burst handler runs multiple in parallel, and doesn't
 * provide the guarantee of any particular order. Burst mode is more likely to hit a 429 ratelimit error by its nature,
 * and is therefore slightly riskier to use.
 * @property {number} [shardId=0] ID of the shard to run
 * @property {number} [shardCount=0] Total number of shards
 * @property {number} [messageCacheMaxSize=200] Maximum number of messages to cache per channel
 * (-1 or Infinity for unlimited - don't do this without message sweeping, otherwise memory usage will climb
 * indefinitely)
 * @property {number} [messageCacheLifetime=0] How long a message should stay in the cache until it is considered
 * sweepable (in seconds, 0 for forever)
 * @property {number} [messageSweepInterval=0] How frequently to remove messages from the cache that are older than
 * the message cache lifetime (in seconds, 0 for never)
 * @property {boolean} [fetchAllMembers=false] Whether to cache all guild members and users upon startup, as well as
 * upon joining a guild (should be avoided whenever possible)
 * @property {boolean} [disableEveryone=false] Default value for {@link MessageOptions#disableEveryone}
 * @property {boolean} [sync=false] Whether to periodically sync guilds (for user accounts)
 * @property {number} [restWsBridgeTimeout=5000] Maximum time permitted between REST responses and their
 * corresponding websocket events
 * @property {number} [restTimeOffset=500] Extra time in millseconds to wait before continuing to make REST
 * requests (higher values will reduce rate-limiting errors on bad connections)
 * @property {WSEventType[]} [disabledEvents] An array of disabled websocket events. Events in this array will not be
 * processed, potentially resulting in performance improvements for larger bots. Only disable events you are
 * 100% certain you don't need, as many are important, but not obviously so. The safest one to disable with the
 * most impact is typically `TYPING_START`.
 * @property {WebsocketOptions} [ws] Options for the WebSocket
 * @property {HTTPOptions} [http] HTTP options
 */

/**
 * Options for a CommandoClient
 * @typedef {ClientOptions} CommandoClientOptions
 * @property {boolean} [selfbot=false] - Whether the command dispatcher should be in selfbot mode
 * @property {string} [commandPrefix=!] - Default command prefix
 * @property {number} [commandEditableDuration=30] - Time in seconds that command messages should be editable
 * @property {boolean} [nonCommandEditable=true] - Whether messages without commands can be edited to a command
 * @property {boolean} [unknownCommandResponse=true] - Whether the bot should respond to an unknown command
 * @property {string|string[]|Set<string>} [owner] - ID of the bot owner's Discord user, or multiple IDs
 * @property {string} [invite] - Invite URL to the bot's support server
 */

class VoiceClient extends CommandoClient {
    /**
     * 
     * @param {CommandoClientOptions} options
     * @param {String} YoutubeAPIKey 
     */
    constructor(options, YoutubeAPIKey){
        super(options);
        this.YoutubeAPIKey = YoutubeAPIKey;
        this.youtube = new Youtube(YoutubeAPIKey);
        this.LyricsAPI = new LyricsAPI();
        /**
         * @type {Collection<String,VoiceModule>}
         */
        this.VoiceModules = new Collection();
        this.PermissionManager = null //in development
        /**
         * @type {Collection<String,Logger>}
         */
        this.loggers = new Collection();
        this.guilds.forEach((guild, id)=>{
            	this.loggers.set(id, new Logger(id));
        });
    }
}
module.exports = VoiceClient;