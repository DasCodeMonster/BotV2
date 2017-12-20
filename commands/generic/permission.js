const commando = require("discord.js-commando");

class Permission extends commando.Command {
    constructor(client) {
        super(client, {
            name: "permission",
            aliases: ["perm"],
            group: "generic",
            memberName: "permission",
            description: "you can decide which users can use which commands.",
            guildOnly: true,
            args:[{
                key: "command",
                label: "command",
                prompt: "you need to provide an command",
                type: "command"
            }, /*{
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
    async run(message, args) {
        console.log(args);
        var commandgroup = args.command.split(":")[0];
        var commandname = args.command.split(":")[1];
        if (commandname === "*") {
            if (commandgroup === "*") {
                if (args.group.type === "user") {
                    this.client.registry.groups.forEach(group => {
                        group.commands.forEach(command => {
                            console.log(command.groupID+":"+command.name);
                            var commandID = `${command.groupID}:${command.name}`;
                            if (this.client.provider.get(message.guild, commandID)) {
                                if (this.client.provider.get(message.guild, commandID).indexOf(args.group.value.id) >= 0) {
                                    if (args.boolean === true) {
                                        return;
                                    }
                                    else {
                                        if (message.guild.member(args.group.value).hasPermission("ADMINISTRATOR")) return;
                                        else this.client.provider.set(message.guild, commandID, args.group.value.id);
                                    }
                                }
                                else {
                                    this.client.provider.set(message.guild, commandID, args.group.value.id);                                    
                                }
                            }
                        });
                    });
                }
            }
        }
    }
    async run2(message, args) {
        console.log(args);
        var commandgroup = args.command.split(":")[0];
        var commandname = args.command.split(":")[1];
        if (commandname === "*") {
            if (commandgroup === "*") {
                if (args.group.type === "user") {
                    this.client.registry.groups.forEach(group => {
                        group.commands.forEach(command => {
                            console.log(command.groupID+":"+command.name);
                            var commandID = `${command.groupID}:${command.name}`;
                            var permissions = this.client.provider.get(message.guild, args.group.value.id, []);
                            if (args.boolean) {
                                if(permissions.indexOf(commandID)>=0){
                                    permissions.splice(permissions.indexOf(commandID), 1);
                                    this.client.provider.set(message.guild, args.group.value.id, permissions);
                                }
                                else return;
                            } else {
                                permissions.push(commandID);
                                this.client.provider.set(message.guild, args.group.value.id, permissions);
                            }
                        });
                    });
                }
            }
        }
    }
}
module.exports = Permission;