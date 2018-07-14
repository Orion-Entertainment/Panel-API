const API = require('../../core/app').API;
const ServerDBs = require('../../core/app').ServerDBs;
const moment = require('moment');

const bigInt = require("big-integer"); const CryptoJS = require("crypto-js");
const pid2guid = function(pid) {
	if (!pid) {return;}
	let steamId = bigInt(pid);
	const parts = [0x42,0x45,0,0,0,0,0,0,0,0];
	for (let i = 2; i < 10; i++) {
        let res = steamId.divmod(256);
        steamId = res.quotient; 
        parts[i] = res.remainder.toJSNumber();
	}
  
	const wordArray = CryptoJS.lib.WordArray.create(new Uint8Array(parts));
	const hash = CryptoJS.MD5(wordArray);
	return hash.toString();
};

let checkingPlayers = false;
async function checkNewPlayers(time) {
    try {
        setTimeout(async function() {
            if (checkingPlayers == false) {
                console.log(`check`)
                checkingPlayers = true;
                for (let i = 0; i < ServerDBs.length; i++) {
                    const DB = ServerDBs[Object.keys(ServerDBs)[i]];
                    console.log(DB)
                    const Query = await DB.query("SELECT `name`,`pid` FROM `players` WHERE `Tracked`='0' LIMIT 250;");
                    if (Query[0] !== undefined) {
                        for (let p = 0; p < Query.length; p++) {
                            const Now = await moment(new Date()).format('YYYY/MM/DD HH:mm:ss');
                            const GUID = await pid2guid(Query[i].pid);
                            const CheckPlayer = await API.query("SELECT `Last Name`,`Names`,`Last IP`,`IPs` FROM `servers_players` WHERE BINARY `GUID`=?;", [GUID]);
                            if (CheckPlayer[0] == undefined) {
                                const Names = JSON.stringify([{
                                    [Query[i].name]: Now
                                }])
                                await API.query("INSERT INTO `servers_players` (`Last Name`,`Names`,`GUID`,`Steam64ID`,`First Seen`) VALUES(?,?,?,?,?);", [Query[i].name,Names,GUID,Query[i].pid,Now]);
                            } else if (CheckPlayer[0].Steam64ID == undefined) {
                                await DB.query("UPDATE `servers_players` set `Steam64ID`=? WHERE BINARY `GUID`=?;", [Query[i].pid,GUID]);
                            }
                            await DB.query("UPDATE `players` set `Tracked`='1' WHERE BINARY `pid`=?;", [Query[i].pid]);
                            return;
                        }
                    } else {return}
                    if (i + 1 == ServerDBs.length) {
                        checkingPlayers = false;
                    }
                }
            }
            checkNewPlayers(time);
        }, time * 1000);
    } catch (error) {
        console.error(error)
        setTimeout(function() {
            checkNewPlayers(time);
        }, time * 1000);
    }
}
checkNewPlayers(15); //Time in seconds