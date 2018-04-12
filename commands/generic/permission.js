const {CommandArgument, CommandoClient, CommandMessage, CommandGroup, Command, Argument, ArgumentCollector} = require("discord.js-commando");
const {Message, Role, Channel, GuildMember, GuildChannel, TextChannel} = require("discord.js");
const commando = require("discord.js-commando");
const { oneLine, stripIndents } = require('common-tags');
const disambiguation = require("../../node_modules/discord.js-commando/src/util");
const Logger = require("../../logger");
const util = require("util");
const PermissionManager = require("../../permissionManager");

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
                key: 'commandORgroup',
				label: 'command/group',
                prompt: 'Which command or group would you like to change the permissions?',
                type: "command|group",
                // validate: val=>true
				// validate: val => {
				// 	if(!val) return false;
				// 	const groups = this.client.registry.findGroups(val);
				// 	if(groups.length === 1) return true;
				// 	const commands = this.client.registry.findCommands(val);
				// 	if(commands.length === 1) return true;
				// 	if(commands.length === 0 && groups.length === 0) return false;
				// 	return stripIndents`
				// 		${commands.length > 1 ? disambiguation(commands, 'commands') : ''}
				// 		${groups.length > 1 ? disambiguation(groups, 'groups') : ''}
				// 	`;
				// },
				// parse: val => {
                //     if(this.client.registry.findGroups(val)[0]){
                //         return {type: "group", value: this.client.registry.findGroups(val)[0]};
                //     }
                //     else if(this.client.registry.findCommands(val)[0]){
                //         return {type: "command", value: this.client.registry.findCommands(val)[0]};
                //     }
                // }
            }, {
                key: "roleORmemberORchannel",
                label: "role/member",
                prompt: "you need to mention a role or user or name a textchannel",
                type: "role|member|textchannel"
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
        if(this.client.loggers.has(message.guild.id)){
            /**
             * @type {Logger}
             */
            var logger = this.client.loggers.get(message.guild.id);
        }else{
            var logger = new Logger(message.guild.id);
            this.client.loggers.set(message.guild.id, logger);
        }
        logger.log(message.author.username+"#"+message.author.discriminator, "("+message.author.id+")", "used", this.name, "command in channel:", message.channel.name, "("+message.channel.id+")\nArguments:", util.inspect(args));
        return;
        /**
         * @type {PermissionManager}
         */
        const PM = this.client.PM;
        if(args.commandORgroup instanceof CommandGroup){
            /**
             * @type {CommandGroup}
             */
            let group = args.commandORgroup;
            group.commands.forEach(command=>{
                if(args.roleORmemberORchannel instanceof GuildMember){
                    /**
                     * @type {GuildMember}
                     */
                    let member = args.roleORmemberORchannel;
                    let res = PM.set(command, member, args.boolean);
                    if(res !== true){
                        logger.warn(res);
                    }
                }else if(args.roleORmemberORchannel instanceof Role){
                    /**
                     * @type {Role}
                     */
                    let role = args.roleORmemberORchannel;
                    role.members.forEach(member=>{
                        let res = PM.set(command, member, args.boolean);
                        if(res !== true){
                            logger.warn(res);
                        }
                    });
                }else if(args.roleORmemberORchannel instanceof Channel){
                    /**
                     * @type {TextChannel}
                     */
                    let channel = args.roleORmemberORchannel;

                }
            });
        }
        PM.set()

        return;
        if (args.cmdOrGrp.type === "command"){
            var command = await this.client.provider.get(message.guild, args.cmdOrGrp.value.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}});
            var name = args.cmdOrGrp.value.name;
            this.edit(message, args, command, name);
            message.reply(`${args.group.value.toString()} is ${args.boolean?"now allowed to use the `"+name+"` command":"not allowed to use the `"+name+" command anymore"}`);
        }
        else if(args.cmdOrGrp.type === "group"){
            args.cmdOrGrp.value.commands.array().forEach((command, index, array)=>{
                var permission = this.client.provider.get(message.guild, command.name, {true:[], false:[], channel: {true: [], false: []}, role:{true: [], false: []}});
                var name = command.name;
                this.edit(message, args, permission, name);                
            });
            message.reply(`${args.group.value.toString()} is ${args.boolean?"now allowed to use the commands of the `"+args.cmdOrGrp.value.name+"` group":"not allowed to use the commands of the`"+args.cmdOrGrp.value.name+"` group anymore"}`);
        }
    }
    /**
     * 
     * @param {Message} message 
     * @param {*} args 
     * @param {*} command 
     */
    async edit(message, args, command, name) {
        console.log(command);
            console.log(args);
            if(args.group.type === "user"){
                if(args.boolean == true){
                    if (command.true.indexOf(args.group.value.id) === -1) {
                        command.true.push(args.group.value.id);
                        if (command.false.indexOf(args.group.value.id)>-1){
                            command.false.splice(command.false.indexOf(args.group.value.id), 1);
                        }
                    }
                }
                if(args.boolean == false){
                    if(command.false.indexOf(args.group.value.id) === -1) {
                        command.false.push(args.group.value.id);
                        if(command.true.indexOf(args.group.value.id)>-1) {
                            command.true.splice(command.true.indexOf(args.group.value.id), 1);
                        }
                    }
                }
                console.log(command);
                await this.client.provider.set(message.guild, name, command);
            }
            else if (args.group.type === "role") {
                console.log(args.group.value);
                if(args.boolean === true){;
                    if(command.role.true.indexOf(args.group.value.id)===-1){
                        command.role.true.push(args.group.value.id);
                        if(command.role.false.indexOf(args.group.value.id)>-1){
                            command.role.false.splice(command.role.false.indexOf(args.group.value.id), 1);
                        }
                    }
                }
                if(args.boolean === false){
                    if(command.role.false.indexOf(args.group.value.id)===-1){
                        command.role.false.push(args.group.value.id);
                        if(command.role.true.indexOf(args.group.value.id)>-1){
                            command.role.true.splice(command.role.true.indexOf(args.group.value.id), 1);
                        }
                    }
                }
                await this.client.provider.set(message.guild, name, command);
                console.log(command);
            }
            else if (args.group.type === "channel"){
                if(args.boolean === true){;
                    if(command.channel.true.indexOf(args.group.value.id) === -1){
                        command.channel.true.push(args.group.value.id);
                        if(command.channel.false.indexOf(args.group.value.id)>-1){
                            command.channel.false.splice(command.channel.false.indexOf(args.group.value.id), 1);
                        }
                    }
                }
                if(args.boolean === false){
                    if(command.channel.false.indexOf(args.group.value.id) === -1){
                        command.channel.false.push(args.group.value.id);
                        if(command.channel.true.indexOf(args.group.value.id)>-1){
                            command.channel.true.splice(command.channel.true.indexOf(args.group.value.id), 1);
                        }
                    }
                }
                await this.client.provider.set(message.guild, name, command);
                console.log(command);
            }
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
        if(command.role.true.indexOf(role.id) >-1) {
            ret = true;
            return true;
        }
        if(index === array.length-1) {
            ret = false;
            return false;
        }
    });
    return ret;
}
module.exports = Permission;