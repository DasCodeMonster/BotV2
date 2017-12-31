const {CommandArgument, CommandoClient, CommandMessage } = require("discord.js-commando");
const {Message} = require("discord.js");
const commando = require("discord.js-commando");
const { oneLine, stripIndents } = require('common-tags');
const disambiguation = require("../../node_modules/discord.js-commando/src/util");

class Permission extends commando.Command {
    /**
     * 
     * @param {CommandoClient} client 
     */
    constructor(client) {
        super(client, {
            name: "permission",
            aliases: ["perm"],
            group: "generic",
            memberName: "permission",
            description: "you can decide which users can use which commands.",
            guildOnly: true,
            args:[{
                key: 'cmdOrGrp',
				label: 'command/group',
				prompt: 'Which command or group would you like to reload?',
				validate: val => {
					if(!val) return false;
					const groups = this.client.registry.findGroups(val);
					if(groups.length === 1) return true;
					const commands = this.client.registry.findCommands(val);
					if(commands.length === 1) return true;
					if(commands.length === 0 && groups.length === 0) return false;
					return stripIndents`
						${commands.length > 1 ? disambiguation(commands, 'commands') : ''}
						${groups.length > 1 ? disambiguation(groups, 'groups') : ''}
					`;
				},
				parse: val => this.client.registry.findGroups(val)[0] || this.client.registry.findCommands(val)[0]
            },/*{
                key: "command",
                label: "command",
                prompt: "you need to provide an command",
                type: "command"
            }, {
                key: "commandgroup",
                label: "commandgroup",
                prompt: "you need to give an commandgroup",
                type: "commandgroup"
            }, {
                key: "commandname",
                label: "commandname",
                prompt: "PLACEHOLDER",
                type: "commandname"
            }, {
                key: "option",
                label: "option",
                prompt: "you need to provide an option",
                type: "option"
            },*/ {
                key: "group",
                label: "role/user",
                prompt: "you need to mention a role or user",
                type: "role_or_user_or_channel"
            }, {
                key: "boolean",
                label: "boolean",
                prompt:"true or false?",
                type: "boolean"
            }],
            guarded: true
            //argsSingleQuotes: true
        });
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async run(message, args) {
        var command = await this.client.provider.get(message.guild, args.cmdOrGrp.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}});
        console.log(command);
        console.log(args);
        if(args.group.type === "user"){
            if(args.boolean == true){
                if (command.true.length != 0){
                    command.true.some((id, index, array)=>{
                        if(id == args.group.value.id){
                            return true;
                        }
                        else {
                            if(index == command.true.length-1){
                                command.true.push(args.group.value.id);
                                return true;
                            }
                        }
                    });
                }
                else command.true.push(args.group.value.id);
                if(command.false.length != 0){
                    command.false.some((id, index, array)=>{
                        if(id == args.group.value.id){
                            command.false.splice(command.false.indexOf(id), 1);
                            return true;
                        }
                        else return false;
                    });
                }
            }
            if(args.boolean == false){
                console.log("false");
                if(command.true.length != 0){
                    command.true.some((id, index, array)=>{
                        if(id == args.group.value.id){
                            command.true.splice(command.true.indexOf(id), 1);
                            return true;
                        }
                        else {
                            return false;
                        }
                    });
                }
                if(command.false.length != 0){
                    command.false.some((id, index, array)=>{
                        if(id == args.group.value.id){
                            return true;
                        }
                        else {
                            if (index == command.false.length-1){
                                command.false.push(args.group.value.id);
                                return true;
                            }
                            return false;
                        }
                    });
                } else {
                    command.false.push(args.group.value.id);
                }
            }
            console.log(command);
            await this.client.provider.set(message.guild, args.cmdOrGrp.name, command);
        }
        else if (args.group.type === "role") {
            // if(args.boolean == true){
            //     if (command.true.length !== 0){
            //         args.group.value.members.array().forEach((member, index, array)=>{
            //             if(command.true.indexOf(member.user.id)>-1){
            //                 return;
            //             }
            //             else {
            //                 command.true.push(member.user.id);
            //                 if(command.false.indexOf(member.user.id)>-1){
            //                     command.false.splice(command.false.indexOf(member.user.id), 1);
            //                 }
            //             }
            //         });
            //     }
            //     else {
            //         args.group.value.members.array().forEach((member, index, array) => {
            //             command.true.push(member.user.id);
            //             if(command.false.indexOf(member.user.id)>-1){
            //                 command.false.splice(command.false.indexOf(member.user.id), 1);
            //             }
            //         });
            //     }
            // }
            // if(args.boolean === false){
            //     if(command.false.length !== 0){
            //         args.group.value.members.array().forEach((member, index, array)=>{
            //             if(command.false.indexOf(member.user.id)>-1){
            //                 return;
            //             }
            //             else {
            //                 command.false.push(member.user.id);
            //                 if(command.true.indexOf(member.user.id)>-1){
            //                     command.true.splice(command.true.indexOf(member.user.id), 1);
            //                 }
            //             }
            //         });
            //     }
            //     else {
            //         args.group.value.members.array().forEach((member, index, array) => {
            //             command.false.push(member.user.id);
            //             if(command.true.indexOf(member.user.id)>-1){
            //                 command.true.splice(command.true.indexOf(member.user.id), 1);
            //             }
            //         });
            //     }
            // }
            // await this.client.provider.set(message.guild, args.cmdOrGrp.name, command);
            // console.log(command);
            console.log(args.group.value);
            if(args.boolean === true){;
                if(command.role.true.indexOf(args.group.value.id)){
                    return;
                }
                else {
                    command.role.true.push(args.group.value.id);
                    if(command.role.false.indexOf(args.group.value.id)>-1){
                        command.role.false.splice(command.role.false.indexOf(args.group.value.id), 1);
                    }
                }
            }
            if(args.boolean === false){
                if(command.role.false.indexOf(args.group.value.id)){
                    return;
                }
                else {
                    command.role.false.push(args.group.value.id);
                    if(command.role.true.indexOf(args.group.value.id)>-1){
                        command.role.true.splice(command.role.true.indexOf(args.group.value.id), 1);
                    }
                }
            }
            await this.client.provider.set(message.guild, args.cmdOrGrp.name, command);
            console.log(command);
        }
        else if (args.group.type === "channel"){
            if(args.boolean === true){;
                if(command.channel.true.indexOf(args.group.value.id)){
                    return;
                }
                else {
                    command.channel.true.push(args.group.value.id);
                    if(command.channel.false.indexOf(args.group.value.id)>-1){
                        command.channel.false.splice(command.channel.false.indexOf(args.group.value.id), 1);
                    }
                }
            }
            if(args.boolean === false){
                if(command.channel.false.indexOf(args.group.value.id)){
                    return;
                }
                else {
                    command.channel.false.push(args.group.value.id);
                    if(command.channel.true.indexOf(args.group.value.id)>-1){
                        command.channel.true.splice(command.channel.true.indexOf(args.group.value.id), 1);
                    }
                }
            }
            await this.client.provider.set(message.guild, args.cmdOrGrp.name, command);
            console.log(command);
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     */
    async hasPermission(message, args){
        var command = await this.client.provider.get(message.guild, this.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}})
        if (message.member.hasPermission("ADMINISTRATOR")|| command.true.indexOf(message.author.id) != -1 || command.channel.true.indexOf(message.channel.id) || command.role.true.indexOf(message.member.roles.array())){
            return true;
        }
        else {
            return false;
        }
    }
}
/**
 * not finished yet
 * @param {*} command 
 */
function role(command) {
    message.member.roles.array().forEach((role, index, array) => {
        command.role.true.indexOf(role.id)

    })
}
module.exports = Permission;