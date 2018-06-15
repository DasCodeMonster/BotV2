const sqlite = require("sqlite");
const fs = require("fs");
const fsp = fs.promises;
const {Readable} = require("stream");
const util = require("util");

class Filehandler {
    /**
     * @param {string} name
     * @param {string} base
     */
    constructor(name, base){
        if(!util.isString(name) || !util.isString(base)) throw new Error("Must be String");
        if(!fs.existsSync(base)) throw new Error("base must exist!");
        if(!fs.statSync(base).isDirectory()) throw new Error("must be directory");
        this.name = name;
        let tmp = base.trim();
        if(tmp.endsWith("/")){
            tmp = tmp.slice(0, tmp.length-1).trim();
        }
        this.basePath = tmp;
        this.database = null;
        /**
         * @type {Map<string, object>}
         */
        this.objs = new Map();
        this.existing = new Object();
        this.watchers = new Map();
    }
    async open(){
        try {
            if(this.database !== null) return this.database;
            this.database = await sqlite.open(`${this.name}.sqlite3`, {promise: Promise});
            let create = await this.database.prepare(`CREATE TABLE IF NOT EXISTS ${this.name} (id VARCHAR(255) PRIMARY KEY, fileobject TEXT, author VARCHAR(255), timestamp TEXT, guildid VARCHAR(255))`);
            await create.run();
            await create.finalize();
            await this._checkExistingDir();
            return this.database;
        } catch (e) {
            console.log(e);
        }
    }
    async _checkExistingDir(){
        try {
            if(fs.existsSync(`${this.basePath}/${this.name}`) && fs.statSync(`${this.basePath}/${this.name}`).isDirectory()){
                await asyncForEach(fs.readdirSync(`${this.basePath}/${this.name}`), async name=>{
                    if(fs.statSync(`${this.basePath}/${this.name}/${name}`).isDirectory()){
                        if(!this.watchers.has(`${this.basePath}/${this.name}/${name}`)){
                            const watcher = fs.watch(`${this.basePath}/${this.name}/${name}`);
                            this.watchers.set(`${this.basePath}/${this.name}/${name}`, watcher);
                            watcher.on("change", async (event, rawname)=>{
                                console.log(event, rawname);
                                if(event === "rename"){
                                    let _name = rawname;
                                    if(fs.existsSync(`${this.basePath}/${this.name}/${name}/${rawname}`)){
                                        if(_name.includes(".")) _name = _name.split(".")[0];
                                        let exists = await this.get(name, _name);
                                        if(exists === null){
                                            if(!this.writeSTMT){
                                                this.writeSTMT = await this.database.prepare(`INSERT OR REPLACE INTO ${this.name} VALUES (?, ?, ?, datetime(?), ?)`);
                                            }
                                            await this.writeSTMT.run(_name, `${this.basePath}/${this.name}/${name}/${rawname}`, undefined, "now", name);
                                        }
                                    }else{
                                        if(_name.includes(".")) _name = _name.split(".")[0];
                                        let exists = await this.get(name, _name);
                                        if(exists !== null){
                                            if(!this.deleteSTMT){
                                                this.deleteSTMT = await this.database.prepare(`DELETE FROM ${this.name} WHERE id=?`);
                                            }
                                            console.log(_name, " l.71");
                                            this.deleteSTMT.run(_name);
                                        }
                                    }
                                }
                            });
                            watcher.on("error", error=>{
                                console.log(error);
                            });
                            await asyncForEach(fs.readdirSync(`${this.basePath}/${this.name}/${name}`), async innername=>{
                                if(fs.statSync(`${this.basePath}/${this.name}/${name}/${innername}`).isDirectory()){
                                    fs.rmdirSync(`${this.basePath}/${this.name}/${name}/${innername}`);            
                                }else if(!fs.statSync(`${this.basePath}/${this.name}/${name}/${innername}`).isFile()){
                                    fs.unlinkSync(`${this.basePath}/${this.name}/${name}/${innername}`);
                                }else{
                                    this.existing[`${this.basePath}/${this.name}/${name}/${innername}`.replace("/", "_")] = true;
                                    // Object.defineProperty(this.existing, `${this.basePath}/${this.name}/${name}/${innername}`.replace("/", "_"), {
                                    //     value: true
                                    // });
                                    let _innername = innername;
                                    if(_innername.includes(".")) _innername = _innername.split(".")[0];
                                    let exist = await this.get(name, _innername);
                                    if(exist === null){
                                        if(!this.writeSTMT){
                                            this.writeSTMT = await this.database.prepare(`INSERT OR REPLACE INTO ${this.name} VALUES (?, ?, ?, datetime(?), ?)`);
                                        }
                                        await this.writeSTMT.run(_innername, `${this.basePath}/${this.name}/${name}/${innername}`, undefined, "now", name);
                                        // this.objs.set()
                                    }
                                }
                            });
                        }
                    }else{
                        fs.unlinkSync(`${this.basePath}/${this.name}/${name}`);
                    }
                });
            }
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * 
     * @param {string} path 
     */
    async makeDir(path, id){
        try {
            if(this.existing[path.replace("/", "_")]) return;
            if(fs.existsSync(path)){
                this.existing[path.replace("/", "_")] = true;
                // Object.defineProperty(this.existing, path.replace("/", "_"), {
                //     value: true
                // }); 
            }else{
                await fsp.mkdir(path);
            }
            if(path.split("/").pop() === this.name) return;
            if(!this.watchers.has(path)){
                const watcher = fs.watch(path);
                this.watchers.set(path, watcher);
                watcher.on("change", async (event, rawname)=>{
                    console.log(event, rawname);
                    if(event === "rename"){
                        let name = rawname;
                        if(fs.existsSync(`${path}/${rawname}`)){
                            if(name.includes(".")) name = name.split(".")[0];
                            let exists = await this.get(id, name);
                            if(exists === null){
                                if(!this.writeSTMT){
                                    this.writeSTMT = await this.database.prepare(`INSERT OR REPLACE INTO ${this.name} VALUES (?, ?, ?, datetime(?))`);
                                }
                                await this.writeSTMT.run(name, `${path}/${rawname}`, undefined, "now", id);
                            }
                        }else{
                            if(name.includes(".")) name = name.split(".")[0];
                            let exists = await this.get(id, name);
                            if(exists !== null){
                                if(!this.deleteSTMT){
                                    this.deleteSTMT = await this.database.prepare(`DELETE FROM ${this.name} WHERE id=?`);
                                }
                                console.log(name, " l.148");
                                this.deleteSTMT.run(name);
                            }
                        }
                    }
                });
                watcher.on("error", error=>{
                    console.log(error);
                });
            }
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * @param {String} id
     * @param {String} name
     * @param {string} fileExtension
     * @param {Readable} stream
     * @param {string} authorID
     */
    async write(id, name, fileExtension, stream, authorID){
        try {
            if(this.database === null) await this.open();
            if(!this.writeSTMT){
                this.writeSTMT = await this.database.prepare(`INSERT OR REPLACE INTO ${this.name} VALUES (?, ?, ?, datetime(?))`);
            }   
            let path = `${this.basePath}/${this.name}/${id}/${name}`;
            if(name.includes(".")){
                name = name.split(".")[0];
            }
            await this.makeDir(`${this.basePath}/${this.name}`, "global");
            await this.makeDir(`${this.basePath}/${this.name}/${id}`, id);
            let ext = fileExtension;
            if(fileExtension.includes(".")){
                ext = fileExtension.split(".", 1)[1];
            }
            let writeStream = fs.createWriteStream(`${path}.${ext}`);
            /**
             * @type {Promise<Boolean>}
             */
            let finished = new Promise((res, rej)=>{
                writeStream.on("close", ()=>res(true));
                if(stream) stream.on("error", err=>rej(err));
            });
            if(stream) stream.pipe(writeStream);
            await this.writeSTMT.run(name, `${path}.${ext}`, authorID, "now", id);
            if(!this.objs.has(id)){
                await this.get(id, name);
            }
            let obj = this.objs.get(id);
            if(!obj){
                obj = {};
            }
            obj[name] = `${path}.${ext}`;
            this.objs.set(id, obj);
            // Object.defineProperty(obj, name, {
            //     value: `${path}.${ext}`,
            //     configurable: true,
            //     enumerable: false,
            //     writable: true
            // });
            return finished;
        } catch (e) {
            console.log(e);
        }
    }
    /**
     * 
     * @param {string} id 
     * @param {string} name 
     */
    async get(id, name){
        try {
            if(this.database === null) await this.open();
            if(!this.getSTMT){
                this.getSTMT = await this.database.prepare(`SELECT * FROM ${this.name} WHERE id=? AND guildid=?`);
            }
            return await this.getSTMT.get(name, id);
            // console.log(this.objs, " l.226", this.objs.has(name));
            // if(!this.objs.has(id)){
            //     if(!this.getSTMT){
            //         this.getSTMT = await this.database.prepare(`SELECT * FROM ${this.name} WHERE guildid=?`);
            //     }
            //     let guildEntries = await this.getSTMT.get(id);
            //     console.log(guildEntries, " l.232");
            //     if(!guildEntries) return null;
            //     let save = {};
            //     if(Array.isArray(guildEntries)){
            //         guildEntries.forEach(entry=>{
            //             save[entry.id] = entry;
            //         });
            //     }else{
            //         save[guildEntries.id] = guildEntries;
            //     }
            //     // Object.defineProperty(save, name, {
            //     //     value: obj.fileobject,
            //     //     writable: true
            //     // });
            //     // console.log(save, " l.236 ", save[name], huh);
            //     this.objs.set(id, save);
            // }else if(this.objs.get(id)[name]){
            //     if(!this.getSTMT){
            //         this.getSTMT = await this.database.prepare(`SELECT * FROM ${this.name} WHERE guildid=?`);
            //     }
            //     let guildEntries = await this.getSTMT.get(id);
            //     console.log(guildEntries, " l.253");
            //     if(!guildEntries) return null;
            //     let save = {};
            //     if(Array.isArray(guildEntries)){
            //         guildEntries.forEach(entry=>{
            //             save[entry.id] = entry;
            //         });
            //     }else{
            //         save[guildEntries.id] = guildEntries;
            //     }
            //     this.objs.set(id, save);
            // }
            // let obj = this.objs.get(id);
            // let keys = Object.getOwnPropertyNames(obj);
            // console.log(keys, " l.239", keys.includes(name), name);
            // if(!keys.includes(name)) return null;
            // return obj[name];
        } catch (e) {
            console.log(e);
        }
    }
    async close(){
        try {
            console.log("closing db");
            let unwatch = new Promise((res, rej)=>{
                let i = 0;
                if(this.watchers.size > 0){
                    this.watchers.forEach(watcher=>{
                        watcher.close();
                        i++;
                        if(i === this.watchers.size) res();
                    });
                }else {
                    res();
                }

            });
            await unwatch;
            this.watchers.clear();
            if(this.getSTMT) {
                await this.getSTMT.finalize();
                this.getSTMT = null;
            }
            if(this.allSTMT) {
                await this.allSTMT.finalize();
                this.allSTMT = null;
            }
            if(this.writeSTMT) {
                await this.writeSTMT.finalize();
                this.writeSTMT = null;
            }
            if(this.deleteSTMT) {
                await this.deleteSTMT.finalize();
                this.deleteSTMT = null;
            }
            await this.database.close();
            this.database = null;
            console.log("exiting");
        } catch (e) {
            console.log(e);
        }
    }
    async getAll(id){
        try {
            if(this.database === null) await this.open();
            if(!this.allSTMT){
                this.allSTMT = await this.database.prepare(`SELECT * FROM ${this.name} WHERE guildid=? OR guildid=? ORDER BY timestamp, id`);
            }
            let all = await this.allSTMT.all(id, "global");
            // console.log(all);
            // /**
            //  * @type {string[]}
            //  */
            // let entries = [];
            // all.forEach(entry=>{
            //     entries.push(entry.id);
            // });
            return all;
        } catch (e) {
            console.log(e);
        }
    }
}
module.exports = Filehandler;

async function asyncForEach(array, callback) {
    for (let index = 0; index < array.length; index++) {
        await callback(array[index], index, array);
    }
}