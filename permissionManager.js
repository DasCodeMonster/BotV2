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
        this.commandPermissions = {};
        this.permissions = {};
        this.standards = standardCommandPermissions;
        this.alwaysTrue = [];
        this.groups.forEach(group=>{
            this.permissions[group.id] = {
                commands: {},
                permissions: {}
            };
            group.commands.forEach(command=>{
                this.permissions[group.id].commands[command.name] = {
                    permissions:{}
                };   
                this.guilds.forEach(guild=>{
                    let guildPerms = client.provider.get(guild.id, "Permissions", client.provider.get(guild, "PermissionStandards", null));                    
                    let userGuildPerms = client.provider.get(guild.id, "UserPermissions", client.provider.get(guild, "PermissionStandards", null));
                    let roleGuildPerms = client.provider.get(guild.id, "RolePermissions",  null);
                    let channelGuildPerms = client.provider.get(guild.id, "ChannelPermissions",  null);
                    /**
                     * @type {Object}
                     */
                    let groupPerms = client.provider.get(guild.id, "GroupPermissions", null);
                    this.permissions[group.id].commands[command.name].permissions[guild.id] = {
                        members: {},
                        roles: {},
                        channels: {}
                    };
                    this.permissions[group.id].permissions[guild.id] = {
                        members: {},
                        roles: {},
                        channels: {}
                    };
                    if(groupPerms !== null){
                        let memberKeys = Object.keys(groupPerms[group.id].members).filter(value=>{
                            return guild.members.has(value);
                        });
                        let newMembers = guild.members.filter(member=>{
                            return memberKeys.includes(member.id);
                        });
                        memberKeys.forEach(key=>{
                            this.permissions[group.id].permissions[guild.id].members[key] = groupPerms[group.id].members[key];
                        });
                        newMembers.forEach(member=>{
                            this.permissions[group.id].permissions[guild.id].members[member.id] = null;
                        });

                        let roleKeys = Object.keys(groupPerms[group.id].roles).filter(value=>{
                            return guild.roles.has(value);
                        });
                        let newRoles = guild.roles.filter(role=>{
                            return roleKeys.includes(role.id);
                        });
                        roleKeys.forEach(key=>{
                            this.permissions[group.id].permissions[guild.id].roles[key] = groupPerms[group.id].roles[key];
                        });
                        newRoles.forEach(role=>{
                            this.permissions[group.id].permissions[guild.id].roles[role.id] = null;
                        });
                        
                        let channelKeys = Object.keys(groupPerms[group.id].channels).filter(value=>{
                            return guild.channels.has(value);
                        });
                        let newChannels = guild.channels.filter(channel=>{
                            return roleKeys.includes(channel.id) && channel instanceof TextChannel;
                        });
                        channelKeys.forEach(key=>{
                            this.permissions[group.id].permissions[guild.id].channels[key] = groupPerms[group.id].channels[key];
                        });
                        newChannels.forEach(channel=>{
                            this.permissions[group.id].permissions[guild.id].channels[channel.id] = null;
                        });
                    }else{
                        guild.members.forEach(member=>{
                            // this.permissions[group.id].commands[command.name].permissions[guild.id].members[member.id] = userGuildPerms;
                            this.permissions[group.id].permissions[guild.id].members[member.id] = null;
                            // this.permissions[group.id].permissions[guild.id].members[member.id] = groupPerms;
                        });
                        guild.roles.forEach(role=>{
                            this.permissions[group.id].permissions[guild.id].roles[role.id] = null;
                            // this.permissions[group.id].permissions[guild.id].roles[role.id] = groupPerms;
                        });
                        guild.channels.filter(channel=>{
                            return channel instanceof TextChannel;
                        }).forEach(channel=>{
                            this.permissions[group.id].permissions[guild.id].channels[channel.id] = null;
                            // this.permissions[group.id].permissions[guild.id].channels[channel.id] = groupPerms;
                        });
                    }
                    if(guildPerms !== null){
                        let memberKeys = Object.keys(guildPerms[group.id].commands[command.name].permissions[guild.id].members).filter(value=>{
                            return guild.members.has(value);
                        });
                        let newMembers = guild.members.filter(member=>{
                            return memberKeys.includes(member.id);
                        });
                        memberKeys.forEach(key=>{
                            this.permissions[group.id].permissions[guild.id].members[key] = groupPerms[group.id].members[key];
                        });
                        newMembers.forEach(member=>{
                            this.permissions[group.id].permissions[guild.id].members[member.id] = null;
                        });

                        let roleKeys = Object.keys(guildPerms[group.id].commands[command.name].permissions[guild.id].roles).filter(value=>{
                            return guild.roles.has(value);
                        });
                        let newRoles = guild.roles.filter(role=>{
                            return !roleKeys.includes(role.id);
                        });
                        roleKeys.forEach(key=>{
                            this.permissions[group.id].permissions[guild.id].roles[key] = groupPerms[group.id].roles[key];
                        });
                        newRoles.forEach(role=>{
                            this.permissions[group.id].permissions[guild.id].roles[role.id] = null;
                        });
                        
                        let channelKeys = Object.keys(guildPerms[group.id].commands[command.name].permissions[guild.id].channels).filter(value=>{
                            return guild.channels.has(value);
                        });
                        let newChannels = guild.channels.filter(channel=>{
                            return !roleKeys.includes(channel.id) && channel instanceof TextChannel;
                        });
                        channelKeys.forEach(key=>{
                            this.permissions[group.id].permissions[guild.id].channels[key] = groupPerms[group.id].channels[key];
                        });
                        newChannels.forEach(channel=>{
                            this.permissions[group.id].permissions[guild.id].channels[channel.id] = null;
                        });
                    }else{
                        guild.members.forEach(member=>{
                            // this.permissions[group.id].commands[command.name].permissions[guild.id].members[member.id] = userGuildPerms;
                            this.permissions[group.id].commands[command.name].permissions[guild.id].members[member.id] = null;
                            // this.permissions[group.id].permissions[guild.id].members[member.id] = groupPerms;
                        });
                        guild.roles.forEach(role=>{
                            this.permissions[group.id].commands[command.name].permissions[guild.id].roles[role.id] = null;
                            // this.permissions[group.id].permissions[guild.id].roles[role.id] = groupPerms;
                        });
                        guild.channels.filter(channel=>{
                            return channel instanceof TextChannel;
                        }).forEach(channel=>{
                            this.permissions[group.id].commands[command.name].permissions[guild.id].channels[channel.id] = null;
                            // this.permissions[group.id].permissions[guild.id].channels[channel.id] = groupPerms;
                        });
                    }
                    // guild.members.forEach(member=>{
                    //     // this.permissions[group.id].commands[command.name].permissions[guild.id].members[member.id] = userGuildPerms;
                    //     this.permissions[group.id].commands[command.name].permissions[guild.id].members[member.id] = guildPerms[group.id].commands[command.name].permissions[guild.id].members[member.id];
                    //     // this.permissions[group.id].permissions[guild.id].members[member.id] = groupPerms;
                    // });
                    // guild.roles.forEach(role=>{
                    //     this.permissions[group.id].commands[command.name].permissions[guild.id].roles[role.id] = roleGuildPerms;
                    //     // this.permissions[group.id].permissions[guild.id].roles[role.id] = groupPerms;
                    // });
                    // guild.channels.forEach(channel=>{
                    //     this.permissions[group.id].commands[command.name].permissions[guild.id].channels[channel.id] = channelGuildPerms;
                    //     // this.permissions[group.id].permissions[guild.id].channels[channel.id] = groupPerms;
                    // });
                });
            });
        });
        // this.users.forEach(user=>{
        //     let userPerm = {};
        //     let rolePerm = {};
        //     this.commands.forEach(command=>{
        //         this.commandPermissions[command.name] = {
        //             permission: {}
        //         }
        //         this.guilds.forEach(guild=>{
        //             let userGuildPerms = client.provider.get(guild.id, "UserPermissions", client.provider.get(guild, "PermissionStandards", null));
        //             let roleGuildPerms = client.provider.get(guild.id, "RolePermissions",  null);                    
        //             let channelGuildPerms = client.provider.get(guild.id, "ChannelPermissions",  null);                    
        //             this.commandPermissions[command.name].permission[guild.id] = {
        //                 members: {},
        //                 roles: {},
        //                 channels: {}
        //             };
        //             guild.members.forEach(member=>{
        //                 this.commandPermissions[command.name].permission[guild.id].members[member.id] = userGuildPerms;
        //             });
        //             guild.roles.forEach(role=>{
        //                 this.commandPermissions[command.name].permission[guild.id].roles[role.id] = roleGuildPerms;
        //             });
        //             let textChannels = guild.channels.filter(channel=>{
        //                 return channel instanceof TextChannel;
        //             });
        //             textChannels.forEach(channel=>{
        //                 this.commandPermissions[command.name].permission[guild.id].channels[channel.id] = channelGuildPerms;
        //             });
        //         });
        //         this.this.commandPermissions = this.commandPermissions;
        //         // return;
        //         // userPerm[command.name] = {
        //         //     permission: {},
        //         //     command: command,
        //         //     group: command.group
        //         // }
        //         // this.guilds.forEach(guild=>{
        //         //     try{
        //         //     let userGuildPerms = client.provider.get(guild.id, "UserPermissions", client.provider.get(guild, "PermissionStandards", null));
        //         //     let roleGuildPerms = client.provider.get(guild.id, "RolePermissions",  null);                    
        //         //     let userStandard;
        //         //     let roleStandard;
        //         //     if(userGuildPerms !== null){
        //         //         userStandard = userGuildPerms[command.name] || null;
        //         //     }else{
        //         //         userStandard = null;
        //         //     }
        //         //     if(roleGuildPerms !== null){
        //         //         roleStandard = roleGuildPerms[command.name] || null;                        
        //         //     }else{
        //         //         roleStandard = null;
        //         //     }
        //         //     userPerm[command.name].permission[guild.id] = userStandard;
        //         //     guild.roles.forEach(role=>{
        //         //         rolePerm[command.name].permission[role.id] = roleStandard;
        //         //     });
        //         //     }catch(e){
        //         //         console.log(e);
        //         //     }
        //         // });
        //     });
        //     this.userPermissions.set(user.id, userPerm);
        // });
        // this.logger.log(this.this.commandPermissions);
        // this.logger.log(util.inspect(this.permissions, false, null));
        
        // console.log(this.userPermissions.first()["ban"].permission);
    }
    /**
     * 
     * @param {Command|CommandGroup} command 
     * @param {GuildMember|TextChannel|Role} member 
     * @param {Boolean|null} boolean 
     */
    set(commandORgroup, memberORchannelORrole, boolean){
        if(commandORgroup instanceof Command){
            let command = commandORgroup;
            if(memberORchannelORrole instanceof GuildMember){
                let member = memberORchannelORrole;
                this.permissions[command.group.id].commands[command.name].permissions[member.guild.id].members[member.id] = boolean;
            }else if(memberORchannelORrole instanceof Role){
                let role = memberORchannelORrole;
                this.permissions[command.group.id].commands[command.name].permissions[role.guild.id].roles[role.id] = boolean;
            }else if(memberORchannelORrole instanceof TextChannel){
                let channel = memberORchannelORrole;
                this.permissions[command.group.id].commands[command.name].permissions[channel.guild.id].channels[channel.id] = boolean;
            }
        } else if(commandORgroup instanceof CommandGroup){
            let group = commandORgroup;
            if(memberORchannelORrole instanceof GuildMember){
                let member = memberORchannelORrole;
                this.permissions[group.id].permissions[member.guild.id].members[member.id] = boolean;
            }else if(memberORchannelORrole instanceof Role){
                let role = memberORchannelORrole;
                this.permissions[group.id].permissions[role.guild.id].roles[role.id] = boolean;
            }else if(memberORchannelORrole instanceof TextChannel){
                let channel = memberORchannelORrole;
                this.permissions[group.id].permissions[channel.guild.id].channels[channel.id] = boolean;
            }
        }
    }
    /**
     * 
     * @param {Command} command 
     * @param {GuildMember} member 
     * @param {TextChannel} channel
     * @returns {Boolean}
     */
    get(command, member, channel){
        if(member.hasPermission("ADMINISTRATOR")){
            return true;
        }
        let userPerm = this.permissions[command.group.id].commands[command.name].permissions[member.guild.id].members[member.id];
        if(userPerm === null){
            let cmdRoles = Object.keys(this.permissions[command.group.id].commands[command.name].permissions[member.guild.id].roles).filter(val=>{
                return this.permissions[command.group.id].commands[command.name].permissions[member.guild.id].roles[val] === true;
            });
            let rolePerm = false;
            member.roles.some(role=>{
                if(cmdRoles.includes(role.id)){
                    rolePerm = true;
                    return rolePerm;
                }
            });

            return this.standards[command.name];

            // if(!rolePerm){
            //     let groupPerm = this.permissions[command.group.id].permissions[member.guild.id].members[member.id];
            //     if(groupPerm === null){
            //         let sth;
            //     }
            // }
        }else {
            return true;
        }
    }
}

module.exports = PermissionManager;
