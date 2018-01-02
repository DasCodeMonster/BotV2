const commando = require("discord.js-commando");

class AddRole extends commando.Command {
    constructor(client) {
        super(client, {
            name: "addrole",
            aliases: ["ar"],
            group: "generic",
            memberName: "addrole",
            description: "add a role which guildmembers can join with the ``joinRole`` command",
            guildOnly: true,
            format: "!addRole @role",
            args: [{
                key: "role",
                label: "role",
                prompt: "which role would you like to add to the joinable roles?",
                type: "role"
            }],
            argsCount: 1
        });
        this.roles = [];
    }
    async run(message, args) {
        if (this.client.provider.get(message.guild, "joinableRoles")) this.roles = this.client.provider.get(message.guild, "joinableRoles");
        this.roles.push(args.role);
        this.client.provider.set(message.guild, "joinableRoles", this.roles);
        message.reply("added "+args.role+" to the ``joinable roles``!");
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @returns {boolean}
     */
    hasPermission(message, args){
        var command = this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}})
        // if (message.member.hasPermission("ADMINISTRATOR")|| command.true.indexOf(message.author.id) != -1 || command.channel.true.indexOf(message.channel.id)>-1 || role(message, command)){
        if(message.member.hasPermission("ADMINISTRATOR")){
            return true;
        }
        if(command.false.indexOf(message.author.id)>-1||command.channel.false.indexOf(message.channel.id)>-1||role(message, command)) return false;
        else {
            return true;
        }
    }
}
/**
 * @param {*} command
 * @param {Message} message
 * @returns {boolean}
 */
function role(message, command) {
    var ret;
    message.member.roles.array().some((role, index, array) => {
        if(command.role.true.indexOf(role.id) >-1) ret = true;return true;
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = AddRole;