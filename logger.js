const {Console} = console;
const fs = require("fs");
const util = require("util");

class Logger extends Console{
    constructor(guildID){
        if(!fs.existsSync("./Logs")){
            fs.mkdirSync("./Logs");
        }
        if(!fs.existsSync(`./Logs/${guildID}`)){
            fs.mkdirSync(`./Logs/${guildID}`);
        }
        super(fs.createWriteStream(`./Logs/${guildID}/${new Date().toLocaleDateString()}.log`, {flags: "a+"}),
            fs.createWriteStream(`./Logs/${guildID}/${new Date().toLocaleDateString()}_errors.log`, {flags: "a+"}));
    }
    log(...params){
        super.log(new Date().toLocaleString()+": " + util.format.apply(null, params));
    }
    error(...params){
        super.error(new Date().toLocaleString()+": " + util.format.apply(null, params));
        super.log(new Date().toLocaleString()+": " + util.format.apply(null, params));
    }
    warn(...params){
        super.warn(new Date().toLocaleString()+": " + util.format.apply(null, params));
        super.log(new Date().toLocaleString()+": " + util.format.apply(null, params));
    }
}
module.exports = Logger;