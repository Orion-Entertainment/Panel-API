const CronJob = require('cron').CronJob;
const API = require('../../core/app').API;
const ServerDBs = require('../../core/app').ServerDBs;

/* Config */
const TimeZone = 'America/New_York';
const selectLimit = 100;
const Config = {
    "Arma3": {
        "ExpireBans": true,
        "RemoveOldHouses": false
    }
};

/* Crons */
//Weekly - Every sunday at midnight
new CronJob('0 0 * * 0', function() {
    RemoveOldHouses();
    
    }, function () {
        return; /* This function is executed when the job stops */
    },
    true,
    TimeZone
);
//Hourly - Every hour
new CronJob('0 * * * *', function() {
    if (Config.Arma3.ExpireBans) API.query("UPDATE `arma_bans` set `Expired`='True' WHERE `Expired`='False' AND (`Expires` IS NOT NULL) AND 0 > TIMESTAMPDIFF(SECOND,NOW(),`Expires`);");
    
    }, function () {
        return; /* This function is executed when the job stops */
    },
    true,
    TimeZone
);

/* Functions */
async function RemoveOldHouses() {
    try {
        if (Config.Arma3.RemoveOldHouses) {
            const SQL = ServerDBs.maldenlife2;

            const getTotalHouses = await SQL.query("SELECT COUNT(`id`) AS 'TotalHouses' FROM `houses` WHERE `owned`='1' AND (`insert_time` < NOW() - INTERVAL 1 MONTH);");
            if (getTotalHouses[0] == undefined) return;
            const TotalHouses = getTotalHouses[0].TotalHouses;

            let setOffset;
            if (TotalHouses < 1) return;
            else if (TotalHouses <= 100) setOffset = 0;
            else setOffset = selectLimit;

            if (setOffset < 1) loopTotal = 1;
            else loopTotal = Math.round(TotalHouses / setOffset);
            
            let Offset = 0;
            for (let i = 0; i < loopTotal; i++) {
                const getHouses = await SQL.query("SELECT `id`,`pid` FROM `houses` WHERE `owned`='1' AND (`insert_time` < NOW() - INTERVAL 1 MONTH) LIMIT "+selectLimit+" OFFSET "+Offset);

                if (getHouses[0] !== undefined) {
                    for (let h = 0; h < getHouses.length; h++) {
                        HouseID = getHouses[h].id;
                        PID = getHouses[h].pid;

                        const checkPlayer = await API.query("SELECT `id` FROM `arma_players` WHERE BINARY `Steam64id`=? AND (`Last Seen` < NOW() - INTERVAL 1 MONTH)",[PID]);
                        if (checkPlayer[0] !== undefined) {
                            await SQL.query("DELETE FROM `houses` WHERE `id`=?;",[HouseID]);
                        }

                        if (h + 1 == getHouses.length) {
                            Offset = Offset + setOffset;
                        }
                    }
                }

                if (i + 1 == loopTotal) {
                    return console.log('end');
                }
            }
        } else return;
    } catch (error) {
        console.log(error);
        return;
    }
}



/* One Time */
const crypto = require('crypto');
const ConnectIPKey = "c5c41c1b95501f36564a288879f2beef";
const LastIPKey = "c8e1e14744282ddc0a0dd2fab8d9f60f";
const IPsKey = "7831b0e33a16c72716ef2e2f5f7d2803";

async function EncryptData(key, data) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data,'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
function QueryableEncrypt(data, key) {
    return "AES_ENCRYPT('"+data+"', '"+key+"')";
}

async function oneTime() {
    try {
        const getTotalPlayers = await API.query("SELECT COUNT(`id`) AS 'TotalPlayers' FROM `arma_players` WHERE `IPs` LIKE '%[{%' AND `Last IPNEW` is null;");
        if (getTotalPlayers[0] == undefined) return;
        const TotalPlayers = getTotalPlayers[0].TotalPlayers;

        let setOffset;
        if (TotalPlayers < 1) return;
        else if (TotalPlayers <= 100) setOffset = 0;
        else setOffset = selectLimit;

        if (setOffset < 1) loopTotal = 1;
        else loopTotal = Math.round(TotalPlayers / setOffset);
        
        let Offset = 0;
        for (let i = 0; i < loopTotal; i++) {
            const getPlayers = await API.query("SELECT `id`,`Last IP`,`IPs` FROM `arma_players` WHERE `IPs` LIKE '%[{%' AND `Last IPNEW` is null LIMIT "+selectLimit+" OFFSET "+Offset);

            if (getPlayers[0] !== undefined) {
                console.log(i, getPlayers.length)
                for (let h = 0; h < getPlayers.length; h++) {
                    const get = getPlayers[h];
                    LastIP = get["Last IP"];
                    IPs = get.IPs;
                    ID = get.id;

                    const ENCLastIP = await QueryableEncrypt(LastIPKey,LastIP);
                    const ENCIPs = await EncryptData(IPsKey,IPs);

                    console.log(ID,ENCLastIP,ENCIPs)
                    //await API.query("UPDATE `arma_players` set `Last IPNEW`=?,`IPsNEW`=? WHERE `id`=?;",[ENCLastIP,ENCIPs,ID]);

                    if (h + 1 == getPlayers.length) {
                        Offset = Offset + setOffset;
                    }
                }
            }

            if (i + 1 == loopTotal) {
                return console.log('end');
            }
        }
    } catch (error) {
        console.log(error);
        return;
    }
}
oneTime();
