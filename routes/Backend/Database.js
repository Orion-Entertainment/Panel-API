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

async function checkNewPlayers(time) {
    try {
        setTimeout(async function() {
            for (var i in ServerDBs) {
                const DB = ServerDBs[i];
                const Query = await DB.query("SELECT `name`,`pid`,`insert_time` FROM `players` WHERE `Tracked`='0' LIMIT 500;");

                if (Query[0] !== undefined) {
                    for (let p = 0; p < Query.length; p++) {
                        const Q = Query[p];
                        const Seen = await moment(Q["insert_time"]).format('YYYY/MM/DD HH:mm:ss');;
                        const GUID = await pid2guid(Q.pid);
                        const CheckPlayer = await API.query("SELECT `Last Name`,`Names`,`Last IP`,`IPs` FROM `servers_players` WHERE BINARY `GUID`=?;", [GUID]);
                        if (CheckPlayer[0] == undefined) {
                            const Names = JSON.stringify([{
                                [Q.name]: Seen
                            }])
                            await API.query("INSERT INTO `servers_players` (`Last Name`,`Names`,`GUID`,`Steam64ID`,`First Seen`) VALUES(?,?,?,?,?);", [Q.name,Names,GUID,Q.pid,Seen]);
                        } else if (CheckPlayer[0].Steam64ID == undefined) {
                            await API.query("UPDATE `servers_players` set `Steam64ID`=? WHERE BINARY `GUID`=?;", [Q.pid,GUID]);
                        }
                        await DB.query("UPDATE `players` set `Tracked`='1' WHERE BINARY `pid`=?;", [Q.pid]);
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



/* Delete after next push */
async function oneTime() {
    try {
        const GetOldLogs = await API.query("SELECT `id`,`Data`,`Time` FROM `servers_logs` ORDER BY `id` ASC;");
        for (let i = 0; i < GetOldLogs.length; i++) {
            const ID = GetOldLogs[i].id;
            const Data = JSON.parse(GetOldLogs[i].Data);
            await API.query("INSERT INTO `arma_kills` (`Killer`,`KillerGroup`,`Killed`,`KilledGroup`,`Weapon`,`Distance`) VALUES(?,?,?,?,?,?);", [Data.Killer,Data.KillerGroup,Data.Killed,Data.KilledGroup,Data.Weapon,Data.Distance]);
            await API.query("DELETE FROM `servers_logs` WHERE id=?;", [ID]);
        };
    } catch (error) {
        console.error(error)
    }
}
oneTime();