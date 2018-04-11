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
        this.standards = {
            disable: false,
            enable: false,
            groups: false,
            load: false,
            reload: false,
            unload: false,

            eval: false,
            help: true,
            ping: true,
            prefix: false,

            addrole: false,
            ban: false,
            invite: true,
            joinrole: true,
            leaverole: true,
            permission: false,
            removerole: false,
            twitch: true,
            userinfo: true,

            addlyrics: true,
            join: true,
            leave: true,
            loop: true,
            lyrics: true,
            pause: true,
            play: true,
            queueremove: true,
            queue: true,
            queueadd: true,
            record: false,
            removelyrics: false,
            resetmusicchannel: true,
            resume: true,
            search: true,
            setmusicchannel: true,
            setvolume: true,
            shuffle: true,
            skip: true,
            songinfo: true,

            give: true,
            points: true
        };
        this.alwaysTrue = [];
        this.users.forEach(user=>{
            let obj = {};           
            this.commands.forEach(command=>{
                obj[command.name] = {
                    permission: {},
                    command: command,
                    group: command.group
                }
                this.guilds.forEach(guild=>{
                    try{
                    let guildPerms = client.provider.get(guild.id, "Permissions", client.provider.get(guild, "PermissionStandards", null));
                    let standard;
                    if(guildPerms !== null){
                        standard = guildPerms[command.name] || null;
                    }else{
                        standard = null;
                    }
                    obj[command.name].permission[guild.id] = standard;
                    }catch(e){
                        console.log(e);
                    }
                });
            });
            this.permissions.set(user.id, obj);
        });
        console.log(this.permissions.first()["ban"].permission);
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
            let copy = this.standards;
            copy[command.name] = boolean;
            this.permissions.set(member.id, copy);
        }else{
            let perm = this.permissions.get(member.id);
            perm[command.name] = boolean;
            this.permissions.set(member.id, perm);
        }
        let obj;
        this.permissions.forEach((val, key)=>{
            obj[key] = val;
        });
        this.client.provider.set(member.guild, "Permissions", obj);
    }
    /**
     * 
     * @param {Command} command 
     * @param {GuildMember} member 
     * @returns {Boolean}
     */
    get(command, member){
        if(member.hasPermission("ADMINISTRATOR")){
            return true;
        }
        let perm = this.permissions.get(member.id)[command.name].permission[member.guild.id];
        if(perm === null){
            let standard = this.client.provider.get(member.guild, "PermissionStandards", this.standards);
            perm = standard[command.name];
        }
        return perm;
    }
}

module.exports = PermissionManager;
