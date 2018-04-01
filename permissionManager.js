const {Collection} = require("discord.js");
const {Client} = require("discord.js-commando");

class PermissionManager {
    /**
     * 
     * @param {Client} client 
     */
    constructor(client){
        /**
         * @type {Collection<String,Collection<String,Collection<Boolean,String[]>>>}
         */
        this.groups = new Collection();
        client.registry.groups.forEach((group, key, map) => {
            var groupColl = new Collection();
            group.commands.forEach((command, key, map)=>{
                var commandColl = new Collection();
                commandColl.set(true, []);
                commandColl.set(false, []);
                groupColl.set(command.groupID, commandColl);
            });
            this.groups.set(group.name, groupColl);
        });
    }

    add(command, user, boolean, standard=true){

    }
}

module.exports = PermissionManager;