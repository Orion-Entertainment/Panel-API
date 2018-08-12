const CronJob = require('cron').CronJob;
const API = require('../../core/app').API;
const ServerDBs = require('../../core/app').ServerDBs;
const paypal = require('../../core/app').Paypal;
const Rcon = require('./RCON').Rcon;
const moment = require('moment');

const ShopPIDKEY = "2979e32f8ed8a94ad85d505d1b193544";

/* Config */
const TimeZone = 'America/New_York';
const selectLimit = 100;
const Config = {
    "Shop": {
        "Arma3": true
    },
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
    //Arma3ShopOld();

    }, function () {
        return; /* This function is executed when the job stops */
    },
    true,
    TimeZone
);
//Minute - Every minute
new CronJob('* * * * *', function() {
    Arma3ShopNew();
    //Arma3ShopOld();

    }, function () {
        return; /* This function is executed when the job stops */
    },
    true,
    TimeZone
);

/* Functions */
async function Arma3ShopOld() {
    try {
        if (Config.Shop.Arma3) {
            const SQL = ServerDBs.maldenlife2;

            const getTotalPurchases = await API.query("SELECT COUNT(`id`) AS 'Total' FROM `shop_purchases` WHERE `Category`='Arma3' AND `Status`!='Ended' AND (`Last Checked` < NOW() - INTERVAL 1 MONTH);");
            if (getTotalPurchases[0] == undefined) return;
            const TotalPurchases = getTotalPurchases[0].Total;

            let setOffset;
            if (TotalPurchases < 1) return;
            else if (TotalPurchases <= 100) setOffset = 0;
            else setOffset = selectLimit;

            if (setOffset < 1) loopTotal = 1;
            else loopTotal = Math.round(TotalPurchases / setOffset);
            
            let Offset = 0;
            for (let i = 0; i < loopTotal; i++) {
                const getPurchases = await API.query("SELECT `id`,"+await QueryableDecrypt("PID", ShopPIDKEY)+",`WID`,`item` FROM `shop_purchases` WHERE `Category`='Arma3' AND `Status`!='Ended' AND (`Last Checked` < NOW() - INTERVAL 1 MONTH) LIMIT "+selectLimit+" OFFSET "+Offset);

                if (getPurchases[0] !== undefined) {
                    for (let p = 0; p < getPurchases.length; p++) {
                        pID = getPurchases[p].id;
                        wID = getPurchases[p].WID;
                        Item = getPurchases[p].item;
                        paypal.getSubscription(pID, async function(err, data) {
                            if (!err) {
                                console.log(data)
                                if (data.status !== "Active") {
                                    const getPlayer = await API.query("SELECT `Steam64ID`,`GUID` FROM `arma_players` WHERE BINARY `id`=?",[wID]);
                                    if (getPlayer[0] !== undefined) {
                                        const check = await Rcon.checkPlayer(getPlayer[0].GUID);
                                        if (!check) {
                                            await SQL.query("UPDATE `players` set `donorlevel`='0' WHERE BINARY `pid`=?;",[getPlayer[0].Steam64ID]); //Update on Maldenlife
                                            await API.query("UPDATE `shop_purchases` set `Last Checked`=?,`Status`='Ended' WHERE `id`=?;",[await moment(new Date()).format('YYYY/MM/DD HH:mm:ss'),pID]);
                                        }
                                    }
                                }
                            }
                        });

                        if (p + 1 == getPurchases.length) {
                            Offset = Offset + setOffset;
                        }
                    }
                }

                if (i + 1 == loopTotal) {
                    return;
                }
            }

        } else return;
    } catch (error) {
        console.log(error);
        return;
    }
}
async function Arma3ShopNew() {
    try {
        if (Config.Shop.Arma3) {
            const SQL = ServerDBs.maldenlife2;

            const getTotalPurchases = await API.query("SELECT COUNT(`id`) AS 'Total' FROM `shop_purchases` WHERE `Category`='Arma3' AND `Status`='Active' AND `Last Checked` IS NULL;");
            if (getTotalPurchases[0] == undefined) return;
            const TotalPurchases = getTotalPurchases[0].Total;

            let setOffset;
            if (TotalPurchases < 1) return;
            else if (TotalPurchases <= 100) setOffset = 0;
            else setOffset = selectLimit;

            if (setOffset < 1) loopTotal = 1;
            else loopTotal = Math.round(TotalPurchases / setOffset);
            
            let Offset = 0;
            for (let i = 0; i < loopTotal; i++) {
                const getPurchases = await API.query("SELECT `id`,`WID`,`item` FROM `shop_purchases` WHERE `Category`='Arma3' AND `Status`='Active' AND `Last Checked` IS NULL LIMIT "+selectLimit+" OFFSET "+Offset);

                if (getPurchases[0] !== undefined) {
                    for (let p = 0; p < getPurchases.length; p++) {
                        pID = getPurchases[p].id;
                        wID = getPurchases[p].WID;
                        Item = getPurchases[p].item;

                        const getPlayer = await API.query("SELECT `Steam64ID`,`GUID` FROM `arma_players` WHERE BINARY `id`=?",[wID]);
                        if (getPlayer[0] !== undefined) {
                            const check = await Rcon.checkPlayer(getPlayer[0].GUID);
                            if (!check) {
                                switch (Item) {
                                    case "VIP 1":
                                        await SQL.query("UPDATE `players` set `donorlevel`='1' WHERE BINARY `pid`=?;",[getPlayer[0].Steam64ID]); //Update on Maldenlife
                                        await API.query("UPDATE `shop_purchases` set `Last Checked`=? WHERE `id`=?;",[await moment(new Date()).format('YYYY/MM/DD HH:mm:ss'),pID]);
                                        break;
                                    case "VIP 2":
                                        await SQL.query("UPDATE `players` set `donorlevel`='2' WHERE BINARY `pid`=?;",[getPlayer[0].Steam64ID]); //Update on Maldenlife
                                        await API.query("UPDATE `shop_purchases` set `Last Checked`=? WHERE `id`=?;",[await moment(new Date()).format('YYYY/MM/DD HH:mm:ss'),pID]);
                                        break;
                                    case "VIP 3":
                                        await SQL.query("UPDATE `players` set `donorlevel`='3' WHERE BINARY `pid`=?;",[getPlayer[0].Steam64ID]); //Update on Maldenlife
                                        await API.query("UPDATE `shop_purchases` set `Last Checked`=? WHERE `id`=?;",[await moment(new Date()).format('YYYY/MM/DD HH:mm:ss'),pID]);
                                        break;
        
                                    default:
                                        console.log('Arma3Shop FNC: Undefined Item | '+Item)
                                }
                            }
                        }
                        

                        if (p + 1 == getPurchases.length) {
                            Offset = Offset + setOffset;
                        }
                    }
                }

                if (i + 1 == loopTotal) {
                    return;
                }
            }

        } else return;
    } catch (error) {
        console.log(error);
        return;
    }
}
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
                    return;
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
const LastIPKey = "c8e1e14744282ddc0a0dd2fab8d9f60f";
const IPsKey = "7831b0e33a16c72716ef2e2f5f7d2803";
const IPKey = "c5c41c1b95501f36564a288879f2beef";

async function EncryptData(key, data) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data,'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
async function DecryptData(key, data) {
    const decipher = crypto.createDecipher('aes-256-cbc', key);
    let decrypted = decipher.update(data,'hex','utf8') 
    decrypted += decipher.final('utf8'); 
    return decrypted; 
}

function QueryableEncrypt(data, key) {
    return "AES_ENCRYPT('"+data+"', '"+key+"')";
}
function QueryableDecrypt(column, key) {
    return "CONVERT(AES_DECRYPT(`"+column+"`, '"+key+"') using utf8) AS '"+column+"'";
};

async function oneTime() {
    try {
        const getTotalPlayers = await API.query("SELECT COUNT(`id`) AS 'TotalPlayers' FROM `arma_connect` WHERE `IP` is not null AND `IPNew` is null;");
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
            const getPlayers = await API.query("SELECT `id`,`IP` FROM `arma_connect` WHERE `IP` is not null AND `IPNew` is null LIMIT "+selectLimit+" OFFSET "+Offset);

            if (getPlayers[0] !== undefined) {
                console.log(i, getPlayers.length)
                for (let h = 0; h < getPlayers.length; h++) {
                    const get = getPlayers[h];
                    ID = get["id"];
                    IP = get["IP"];

                    const ENCIP = await QueryableEncrypt(IPKey,IP);

                    await API.query("UPDATE `arma_connect` set `IPNEW`="+ENCIP+" WHERE `id`=?;",[ID]);

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
//oneTime();