const commando = require("discord.js-commando");

class Userinfo extends commando.Command {
    constructor(client) {
        super(client, {
            name: "userinfo",
            aliases: ["ui"],
            group: "generic",
            memberName: "userinfo",
            description: "gives you some info about the mentioned user.",
            guildOnly: true,
            args: [{
                key: "user",
                label: "user",
                prompt: "about which user do you want to have informations?",
                type: "user"
            }]
        });
    }
    async run(message, args) {
        // var permissions = await this.client.provider.get(message.guild, message.member.user.id, []);
        // console.log(permissions);
        // console.log(this.groupID);
        // if (permissions.indexOf(`${this.groupID}:${this.name}`)>=0) {
        //     return;
        // }
        if (args.user.avatarURL == null){
            var avatarURL = args.user.displayAvatarURL;
        }
        else var avatarURL = args.user.avatarURL;
        console.log(avatarURL);
        if (this.client.provider.get(message.guild, args.user.id)) var points = this.client.provider.get(message.guild, args.user.id);
        else var points = 0;
        var roles = "";
        /*message.member.roles.array().forEach((role, index, array)=> {
            console.log(index);
            if(role && index===0){
                roles+=role.toString();
                console.log(roles);
            }else if(role){
                roles += "\n"+role.toString();
                console.log(roles);
            }
            console.log(index);
            console.log(array.length);
            if(index+1===array.length){
                message.channel.send({embed: {
                    "title": args.user.username + " #"+args.user.discriminator,
                    "color": 666,
                    "thumbnail": {
                        "url": avatarURL
                    },
                    "timestamp": new Date(),
                    "fields": [{
                        "name": "ID",
                        "value": args.user.id
                    }, {
                        "name": "Bot",
                        "value": this.isBot(args)
                    }, {
                        "name": "Points",
                        "value": points
                    }, {
                        "name": "Roles",
                        "value": roles
                    }]
                }});
            }
        });*/
        this.client.guilds.array().some((guild, index, array)=>{
            if(guild==message.guild){
                guild.member(args.user).roles.array().forEach((role, index, array)=>{
                    if(role && index===0){
                        roles+=role.toString();
                    }else if(role){
                        roles += "\n"+role.toString();
                    }
                    if(index+1===array.length){
                        message.channel.send({embed: {
                            "title": args.user.username + " #"+args.user.discriminator,
                            "color": 666,
                            "thumbnail": {
                                "url": avatarURL
                            },
                            "timestamp": new Date(),
                            "fields": [{
                                "name": "ID",
                                "value": args.user.id
                            }, {
                                "name": "Bot",
                                "value": this.isBot(args)
                            }, {
                                "name": "Points",
                                "value": points
                            }, {
                                "name": "Roles",
                                "value": roles
                            }]
                        }});
                    }
                });
            }
        });
    }
    isBot(args) {
        if(args.user.bot) var bot = ":white_check_mark:";
        else var bot = ":x:";
        return bot;
    }
}
module.exports = Userinfo;