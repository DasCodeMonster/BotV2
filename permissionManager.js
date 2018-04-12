const {Collection, Client, User, GuildMember, TextChannel, Role} = require("discord.js");
const {CommandoClient, Command, CommandGroup} = require("discord.js-commando");
const {standardCommandPermissions} = require("./tokens");
const Logger = require("./logger");
const util = require("util");

class PermissionManager {
    /**
     * 
     * @param {CommandoClient} client 
     */
    constructor(client){
        this.client = client;
        this.logger = new Logger("PermissionManager");
        this.users = client.users;
        this.groups = client.registry.groups;
        this.commands = client.registry.commands;
        this.guilds = client.guilds;
        this.userPermissions = new Collection();
        this.rolePermissions = new Collection();
        this.standards = standardCommandPermissions;
        this.alwaysTrue = [];
        this.users.forEach(user=>{
            let userPerm = {};
            let rolePerm = {};
            let test = {};
            this.commands.forEach(command=>{

                
                test[command.name] = {
                    command: command,
                    cmdGroup: command.group,
                    permission: {}
                }
                this.guilds.forEach(guild=>{
                    let userGuildPerms = client.provider.get(guild.id, "UserPermissions", client.provider.get(guild, "PermissionStandards", null));
                    let roleGuildPerms = client.provider.get(guild.id, "RolePermissions",  null);                    
                    let channelGuildPerms = client.provider.get(guild.id, "ChannelPermissions",  null);                    
                    test[command.name].permission[guild.id] = {
                        members: {},
                        roles: {},
                        channels: {}
                    };
                    console.log(test);
                    guild.members.forEach(member=>{
                        test[command.name].permission[guild.id].members[member.id] = userGuildPerms;
                    });
                    guild.roles.forEach(role=>{
                        test[command.name].permission[guild.id].roles[role.id] = roleGuildPerms;
                    });
                    let textChannels = guild.channels.filter(channel=>{
                        return channel instanceof TextChannel;
                    });
                    textChannels.forEach(channel=>{
                        test[command.name].permission[guild.id].channels[channel.id] = channelGuildPerms;
                    });
                });
                this.test = test;
                return;
                userPerm[command.name] = {
                    permission: {},
                    command: command,
                    group: command.group
                }
                this.guilds.forEach(guild=>{
                    try{
                    let userGuildPerms = client.provider.get(guild.id, "UserPermissions", client.provider.get(guild, "PermissionStandards", null));
                    let roleGuildPerms = client.provider.get(guild.id, "RolePermissions",  null);                    
                    let userStandard;
                    let roleStandard;
                    if(userGuildPerms !== null){
                        userStandard = userGuildPerms[command.name] || null;
                    }else{
                        userStandard = null;
                    }
                    if(roleGuildPerms !== null){
                        roleStandard = roleGuildPerms[command.name] || null;                        
                    }else{
                        roleStandard = null;
                    }
                    userPerm[command.name].permission[guild.id] = userStandard;
                    guild.roles.forEach(role=>{
                        rolePerm[command.name].permission[role.id] = roleStandard;
                    });
                    }catch(e){
                        console.log(e);
                    }
                });
            });
            this.userPermissions.set(user.id, userPerm);
        });
        // this.logger.log(this.test);
        this.logger.log(util.inspect(this.test.help.permission, false, 5));
        
        // console.log(this.userPermissions.first()["ban"].permission);
    }
    /**
     * 
     * @param {Command|CommandGroup} command 
     * @param {GuildMember|TextChannel|Role} member 
     * @param {Boolean} boolean 
     * @param {*} standard 
     */
    set(command, member, boolean){
        // if(member.hasPermission("ADMINISTRATOR")){
        //     // this.userPermissions.get(member.id)[command.name] = true;
        //     return new Error("Member is Administrator. Cannot change userPermissions");
        // }
        if(!this.userPermissions.has(member.id)){
            let copy = this.standards;
            copy[command.name] = boolean;
            this.userPermissions.set(member.id, copy);
        }else{
            let perm = this.userPermissions.get(member.id);
            perm[command.name] = boolean;
            this.userPermissions.set(member.id, perm);
        }
        let userPerm;
        this.userPermissions.forEach((val, key)=>{
            userPerm[key] = val;
        });
        this.client.provider.set(member.guild, "UserPermissions", userPerm);
        return true;
    }
    /**
     * 
     * @param {Command|CommandGroup} command 
     * @param {GuildMember|TextChannel|Role} member 
     * @param {Boolean} boolean 
     */
    set(commandORgroup, memberORchannelORrole, boolean){
        if(commandORgroup instanceof Command){
            let command = commandORgroup;
            if(memberORchannelORrole instanceof GuildMember){
                let member = memberORchannelORrole;
                if(!this.userPermissions.has(member.id)){
                    let copy = this.standards;
                    copy[command.name] = boolean;
                    this.userPermissions.set(member.id, copy);
                }else{
                    let perm = this.userPermissions.get(member.id);
                    perm[command.name] = boolean;
                    this.userPermissions.set(member.id, perm);
                }
            }else if(memberORchannelORrole instanceof Role){
                let role = memberORchannelORrole;

            }
        }
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
        let perm = this.userPermissions.get(member.id)[command.name].permission[member.guild.id];
        if(perm === null){
            let standard = this.client.provider.get(member.guild, "PermissionStandards", this.standards);
            perm = standard[command.name];
        }
        return perm;
    }
}

module.exports = PermissionManager;
