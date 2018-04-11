const {Collection, Client, User, GuildMember} = require("discord.js");
const {CommandoClient, Command} = require("discord.js-commando");

class PermissionManager {
    /**
     * 
     * @param {CommandoClient} client 
     */
    constructor(client){
        this.client = client;
        this.users = client.users;
        this.groups = client.registry.groups;
        this.commands = client.registry.commands;
        this.guilds = client.guilds;
        this.permissions = new Collection();
        this.standards = client.provider.get(null, "PermissionStandards", {
            permission: false,
            removerole: false,
            ban: false,
            addrole: false
        });
        this.users.forEach(user=>{
            let obj = {};
            this.commands.forEach(command=>{
                this.guilds.forEach(guild=>{
                    let guildPerms = client.provider.get(guild.id, "Permissions", client.provider.get(guild, "PermissionStandards", this.standards));
                    let standard = guildPerms[command.name] || null;
                    obj[command.name] = {
                        permission: standard,
                        command: command,
                        group: command.group
                    }
                });
            });
            this.permissions.set(user.id, obj);
        });
    }
    /**
     * 
     * @param {Command} command 
     * @param {GuildMember} member 
     * @param {Boolean} boolean 
     * @param {*} standard 
     */
    set(command, member, boolean){
        if(member.hasPermission("ADMINISTRATOR")){
            // this.permissions.get(member.id)[command.name] = true;
             return new Error("Member is Administrator. Cannot change permissions");
            }
        if(!this.permissions.has(member.id)){
            this.permissions.set(member.id, this.standards[command.name] = boolean);
            return;
        }
        this.permissions.set(member.id, this.permissions.get(member.id)[command.name] = boolean);
    }
    /**
     * 
     * @param {Command} command 
     * @param {GuildMember} member 
     * @returns {Boolean}
     */
    get(command, member){
        let perm = this.permissions.get(member.id)[command.name].permission;
        if(perm === null){
            let standard = this.client.provider.get(member.guild, "PermissionStandards", this.standards);

        }
        return 
    }
}

module.exports = PermissionManager;
