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

const TrackedNum = 2;
async function checkNewPlayers(time) {
    try {
        setTimeout(async function() {
            for (var i in ServerDBs) {
                const DB = ServerDBs[i];
                const Query = await DB.query("SELECT `name`,`pid`,`insert_time` FROM `players` WHERE `Tracked`<? LIMIT 250;", [TrackedNum]);

                if (Query[0] !== undefined) {
                    for (let p = 0; p < Query.length; p++) {
                        const Q = Query[p];
                        const Seen = await moment(Q["insert_time"]).format('YYYY/MM/DD HH:mm:ss');;
                        const GUID = await pid2guid(Q.pid);
                        const CheckPlayer = await API.query("SELECT `Last Name`,`Names`,`Last IP`,`IPs` FROM `arma_players` WHERE BINARY `GUID`=?;", [GUID]);
                        if (CheckPlayer[0] == undefined) {
                            const Names = JSON.stringify([{
                                Name: Q.name,
                                Time: Seen
                            }])
                            await API.query("INSERT INTO `arma_players` (`Last Name`,`Names`,`GUID`,`Steam64ID`,`First Seen`) VALUES(?,?,?,?,?);", [Q.name,Names,GUID,Q.pid,Seen]);
                        } else if (CheckPlayer[0].Steam64ID == undefined) {
                            await API.query("UPDATE `arma_players` set `Steam64ID`=? WHERE BINARY `GUID`=?;", [Q.pid,GUID]);
                        }
                        await DB.query("UPDATE `players` set `Tracked`=? WHERE BINARY `pid`=?;", [TrackedNum,Q.pid]);
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