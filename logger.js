const {Console} = console;
const fs = require("fs");
const util = require("util");
const colors = require("colors");
colors.setTheme({
    info: "green",
    debug: "cyan",
    error: "red",
    warn: "yellow"
});

class Logger extends Console{
    /**
     * 
     * @param {String} guildID 
     */
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
        console.log(util.format.apply(null, params));
    }
    error(...params){
        super.error(new Date().toLocaleString()+": " + util.format.apply(null, params));
        super.log(new Date().toLocaleString()+": " + util.format.apply(null, params));
        console.error(util.format.apply(null, params).error);
    }
    warn(...params){
        super.warn(new Date().toLocaleString()+": " + util.format.apply(null, params));
        super.log(new Date().toLocaleString()+": " + util.format.apply(null, params));
        console.warn(util.format.apply(null, params).warn);
    }
    debug(...params){
        super.debug(new Date().toLocaleString()+": " + util.format.apply(null, params));
        // super.log(new Date().toLocaleString()+": " + util.format.apply(null, params));
        console.debug(util.format.apply(null, params).debug);
    }
    info(...params){
        super.info(new Date().toLocaleString()+": " + util.format.apply(null, params));
        // super.log(new Date().toLocaleString()+": " + util.format.apply(null, params));
        console.info(util.format.apply(null, params.info));
    }
}
module.exports = Logger;