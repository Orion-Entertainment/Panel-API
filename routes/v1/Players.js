const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */
const IPsKey = "7831b0e33a16c72716ef2e2f5f7d2803";

/* Added NPM Packages */
const crypto = require('crypto');

/* Functions */
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

function formatNumber(number) {
    if (number == null) return null;
    else return number.toLocaleString();
}

function returnFalse(res, Name) {
    return res.json({
        [Name]: false
    }).end();
}

function returnResults(res, Name, Results) {
    return res.json({
        [Name]: Results
    }).end();
}


/* Routers */
router.post('/Search', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.SearchVal == undefined) return res.json({Error: "SearchVal Undefined"})
        const Search = '%'+req.body.SearchVal+'%';
        if (Search == "") return res.json({Error: "SearchVal Empty"})
        req.API.query("SELECT `id`,`Last Name`,`Steam64ID` FROM `arma_players` WHERE `Last Name` LIKE ? OR `GUID` LIKE ? OR `Steam64ID` LIKE ? OR `Names` LIKE ?  ORDER BY `id` DESC LIMIT 25;", [Search,Search,Search,Search], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            if (results[0] == undefined) return returnFalse(res, "Results"); else return returnResults(res, "Results", results);
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/KillFeed', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        req.API.query("SELECT `Server`,`Killer`,`KillerName`,`KillerGroup`,`KilledName`,`Killed`,`KilledGroup`,`Weapon`,`Distance`,`Time` FROM `arma_kills` WHERE `Server` IS NOT NULL AND `Killer` IS NOT NULL AND `Weapon` IS NOT NULL ORDER BY `id` DESC LIMIT 50;", async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            } else if (results[0] == undefined) return returnFalse(res, "Kills"); else return returnResults(res, "Kills", results);
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/TopCharts', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        else if (req.body.Server == undefined) return res.json({Error: "Server Undefined"})
        else if (req.body.Category == undefined) return res.json({Error: "Category Undefined"})
        const Category = req.body.Category;
        const Server = req.body.Server;

        let SQL;
        switch (Server) {
            case "MaldenLife":
                SQL = req.ServerDBs.maldenlife2;
                break;
            
            default: 
                return res.json({Error: "Invalid Server"})
        }

        //server
        switch (Category) {
            case "Money":
                SQL.query("SELECT `name`,`pid`,`Money` FROM ( SELECT SUM(`cash`+`bankacc`) as `Money`, `name`, `pid` FROM `players` GROUP BY `name` ) as table1 ORDER BY `Money` DESC LIMIT 25;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    } else if (results[0] == undefined) return returnFalse(res, Category); else return returnResults(res, Category, results);
                });
                break;

            case "EXP":
                SQL.query("SELECT `name`,`pid`,`exp_level`,`exp_total`,`exp_perkPoints` FROM `players` ORDER BY `exp_level` DESC, `exp_total` DESC, `exp_perkPoints` DESC LIMIT 25;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    } else if (results[0] == undefined) return returnFalse(res, Category); else return returnResults(res, Category, results);
                });
                break;

            case "GangFunds":
                SQL.query("SELECT `name`,`bank` FROM `gangs` ORDER BY `bank` DESC LIMIT 25;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    } else if (results[0] == undefined) return returnFalse(res, Category); else return returnResults(res, Category, results);
                });
                break;

            case "Bounty":
                SQL.query("SELECT `wantedID`,`wantedName`,`wantedBounty` FROM `wanted` ORDER BY `wantedBounty` DESC LIMIT 25;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    } else if (results[0] == undefined) return returnFalse(res, Category); else return returnResults(res, Category, results);
                });
                break;

            default: 
                return res.json({Error: "Invalid Category"})
        }
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/Info', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        else if (req.body.PlayerID == undefined) return res.json({Error: "PlayerID Undefined"})
        else if (req.body.Private == undefined) return res.json({Error: "Private Undefined"})
        else if (req.body.Staff == undefined) return res.json({Error: "Staff Undefined"})
        const PlayerID = req.body.PlayerID;
        const sPermissions = req.body.Staff;

        if (req.body.Option == undefined) {
            if (PlayerID == "" | isNaN(PlayerID)) return res.json({Error: "PlayerID Invalid"})
            req.API.query("SELECT `id`,`Last Name`,`Steam64ID`,`GUID`,`First Seen`,`Last Seen` FROM `arma_players` WHERE `id`=?;", [PlayerID], async function (error, results, fields) {
                if (error) {
                    console.error(error)
                    return res.json({Error: error})
                } else if (results[0] == undefined) return returnFalse(res, "Info"); else {
                    const Result = results[0];
                    if (req.body.Private == Result["Steam64ID"] | req.body.Private == true) Private = true; else Private = false;
                    return res.json({
                        "Info": {
                            "id": Result["id"],
                            "LastName": Result["Last Name"],
                            "Steam64ID": Result["Steam64ID"],
                            "GUID": Result["GUID"],
                            "FirstSeen": await moment(Result["First Seen"]).format('YYYY/MM/DD HH:mm:ss'),
                            "LastSeen": await moment(Result["Last Seen"]).format('YYYY/MM/DD HH:mm:ss'),

                            "Private": Private,
                            "Staff": sPermissions
                        }
                    }).end();
                }
            });
        } else {
            const Option1 = req.body.Option;
            if (Option1 == "") return res.json({Error: "Option Invalid"})

            const getInfo = await req.API.query("SELECT `GUID`,`Steam64ID` FROM `arma_players` WHERE BINARY `id`=?", [PlayerID]);
            if (getInfo[0] == undefined) return res.json({Error: "Failed Getting Player Info"});
            const GUID = getInfo[0].GUID;
            const Steam64ID = getInfo[0].Steam64ID;

            switch (Option1) {
                case "Get":
                    if (req.body.Option2 == undefined) return res.json({Error: "Option2 Undefined"})
                    else if (req.body.Option2 == "") return res.json({Error: "Option2 Invalid"})
                    const Option2 = req.body.Option2;

                    switch (Option2) {
                        /* Public Information */
                        case "Names":
                            req.API.query("SELECT `Names` FROM `arma_players` WHERE BINARY `GUID`=? LIMIT 1;", [GUID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else {
                                    const Data = JSON.parse(results[0].Names);
                                    if (req.body.Total !== undefined) {
                                        return returnResults(res, Option2, {
                                            Total: Data.length,
                                            Data: Data.reverse()
                                        });
                                    } else return returnResults(res, Option2, Data.reverse());
                                }
                            });
                            break;
                        case "Bans":
                            if (req.body.Option3 !== undefined) {
                                if (req.body.Option3 !== "") Expired = ""; else Expired = " AND `Expired`='false'";
                            } else Expired = " AND `Expired`='false'";

                            req.API.query("SELECT `id`,`Server`,`Reason`,`Created`,`Expires` FROM `arma_bans` WHERE BINARY `GUID`=?"+Expired+" ORDER BY `id` DESC LIMIT 20;", [GUID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else {
                                    let Return = [];
                                    for (let i = 0; i < results.length; i++) {
                                        const Info = results[i];
                                        if (Info["Server"] == null) Server = "All";
                                            else Server = Info["Server"];
                                        if (Info["Expires"] == null) Expires = "Never";
                                            else Expires = await moment(Info["Expires"]).format('YYYY/MM/DD HH:mm:ss');
                                            
                                        Return.push({
                                            id: Info["id"],
                                            Server: Server,
                                            Reason: Info["Reason"],
                                            Created: await moment(Info["Created"]).format('YYYY/MM/DD HH:mm:ss'),
                                            Expires: Expires
                                        })

                                        if (i + 1 == results.length) {
                                            if (req.body.Total !== undefined) {
                                                const getTotal = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_bans` WHERE BINARY `GUID`=?"+Expired+";", [GUID]);
                                                return returnResults(res, Option2, {
                                                    Total: getTotal[0].length,
                                                    Data: JSON.parse(results[0].Names)
                                                });
                                            } else return returnResults(res, Option2, Return);
                                        }
                                    };
                                }
                            });
                            break;
                        case "Kicks":
                            req.API.query("SELECT `Server`,`By`,`Name`,`Reason`,`Time` FROM `arma_kick` WHERE BINARY `GUID`=? ORDER BY `id` DESC LIMIT 20;", [GUID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else {
                                    let Return = [];
                                    for (let i = 0; i < results.length; i++) {
                                        const Info = results[i];
                                            
                                        Return.push({
                                            Server: Info["Server"],
                                            Name: Info["Name"],
                                            Reason: Info["Reason"],
                                            Time: await moment(Info["Time"]).format('YYYY/MM/DD HH:mm:ss')
                                        })

                                        if (i + 1 == results.length) {
                                            if (req.body.Total !== undefined) {
                                                const getTotal = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_kick` WHERE BINARY `GUID`=?;", [GUID]);
                                                return returnResults(res, Option2, {
                                                    Total: getTotal[0].length,
                                                    Data: Return
                                                });
                                            } else return returnResults(res, Option2, Return);
                                        }
                                    };
                                }
                            });
                            break;
                        case "Kills":
                            if (req.body.Option3 !== undefined) {
                                if (req.body.Option3 !== "") Kills = "`Killer`='"+Steam64ID+"' OR `Killed`='"+Steam64ID+"'"; else Kills = "`Killer`='"+Steam64ID+"' AND `Killed`!='"+Steam64ID+"'";
                            } else Kills = "`Killer`='"+Steam64ID+"' AND `Killed`!='"+Steam64ID+"'";
                            
                            if (Steam64ID == null) return returnFalse(res, Option2);
                            req.API.query("SELECT `Server`,`KilledName`,`Killed`,`KilledGroup`,`Weapon`,`Time` FROM `arma_kills` WHERE BINARY "+Kills+" ORDER BY `id` DESC LIMIT 20;", async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else {
                                    let Return = [];
                                    for (let i = 0; i < results.length; i++) {
                                        const Info = results[i];
                                            
                                        Return.push({
                                            Server: Info["Server"],
                                            Name: Info["KilledName"],
                                            KilledGroup: Info["KilledGroup"],
                                            Killed: Info["Killed"],
                                            Weapon: Info["Weapon"],
                                            Time: await moment(Info["Time"]).format('YYYY/MM/DD HH:mm:ss')
                                        })

                                        if (i + 1 == results.length) {
                                            if (req.body.Total !== undefined) {
                                                const getTotal = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_kills` WHERE BINARY "+Kills+";");
                                                return returnResults(res, Option2, {
                                                    Total: getTotal[0].length,
                                                    Data: Return
                                                });
                                            } else return returnResults(res, Option2, Return);
                                        }
                                    };
                                }
                            });
                            break;

                        //Servers
                        case "MaldenLife":
                            if (Steam64ID == null) return returnFalse(res, Option2);
                            req.ServerDBs.maldenlife2.query("SELECT SUM(`bankacc`+`cash`) AS 'Money',`coplevel`,`mediclevel`,`donorlevel`,`exp_level`,`exp_total`,`exp_perkPoints` FROM `players` WHERE BINARY `pid`=?;", [Steam64ID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else if (results[0].Money == null) return returnFalse(res, Option2); else {
                                    const Result = results[0];
                                    return res.json({
                                        "MaldenLife": [{
                                            Money: await formatNumber(Result["Money"]),
                                            exp_level: await formatNumber(Result["exp_level"]),
                                            exp_total: await formatNumber(Result["exp_total"]),
                                            exp_perkPoints: await formatNumber(Result["exp_perkPoints"]),
                                            coplevel: Result["coplevel"],
                                            mediclevel: Result["mediclevel"],
                                            donorlevel: Result["donorlevel"]
                                        }]
                                    }).end();
                                }
                            });
                            break;

                        /* Private Information */
                        case "Vehicles":
                            if (Steam64ID == null) return returnFalse(res, Option2); else if (req.body.Private == undefined) return res.json({Error: "Invalid Permissions"}); else if (req.body.Private !== true && req.body.Private !== Steam64ID) return res.json({Error: "Invalid Permissions"});
                            req.ServerDBs.maldenlife2.query("SELECT `side`,`classname`,`type`,`plate`,`insert_time`,`insure` FROM `vehicles` WHERE BINARY `pid`=? AND `alive`='1' ORDER BY `id` DESC LIMIT 25;", [Steam64ID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else {
                                    if (req.body.Total !== undefined) {
                                        const getTotal = await req.ServerDBs.maldenlife2.query("SELECT COUNT(`id`) AS 'Total' FROM `vehicles` WHERE BINARY `pid`=? AND `alive`='1';", [Steam64ID]);
                                        return returnResults(res, Option2, {
                                            Total: getTotal[0].length,
                                            Data: results
                                        });
                                    } else return returnResults(res, Option2, results);
                                }
                            });
                            break;
                        case "Houses":
                            if (Steam64ID == null) return returnFalse(res, Option2); else if (req.body.Private == undefined) return res.json({Error: "Invalid Permissions"}); else if (req.body.Private !== true && req.body.Private !== Steam64ID) return res.json({Error: "Invalid Permissions"});
                            req.ServerDBs.maldenlife2.query("SELECT `id`,`pos`,`insert_time` FROM `houses` WHERE BINARY `pid`=? AND `owned`='1' ORDER BY `id` DESC LIMIT 25;", [Steam64ID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else {
                                    if (req.body.Total !== undefined) {
                                        const getTotal = await req.ServerDBs.maldenlife2.query("SELECT COUNT(`id`) AS 'Total' FROM `houses` WHERE BINARY `pid`=? AND `owned`='1';", [Steam64ID]);
                                        return returnResults(res, Option2, {
                                            Total: getTotal[0].length,
                                            Data: results
                                        });
                                    } else return returnResults(res, Option2, results);}
                            });
                            break;
                        case "HouseItems":
                            if (Steam64ID == null) return returnFalse(res, Option2); else if (req.body.Private == undefined) return res.json({Error: "Invalid Permissions"}); else if (req.body.Private !== true && req.body.Private !== Steam64ID) return res.json({Error: "Invalid Permissions"});
                            req.ServerDBs.maldenlife2.query("SELECT `classname`,`pos`,`inventory`,`gear`,`insert_time` FROM `containers` WHERE BINARY `pid`=? AND `owned`='1' ORDER BY `id` DESC LIMIT 25;", [Steam64ID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else {
                                    if (req.body.Total !== undefined) {
                                        const getTotal = await req.ServerDBs.maldenlife2.query("SELECT COUNT(`id`) AS 'Total' FROM `containers` WHERE BINARY `pid`=? AND `owned`='1';", [Steam64ID]);
                                        return returnResults(res, Option2, {
                                            Total: getTotal[0].length,
                                            Data: results
                                        });
                                    } else return returnResults(res, Option2, results);
                                }
                            });
                            break;

                        /* Staff Information */
                        case "IPs":
                            if (Steam64ID == null) return returnFalse(res, Option2);
                            else if (sPermissions !== true && sPermissions.Players !== undefined) {
                                if (sPermissions.Players.viewIPs !== true) return res.json({Error: "Invalid Permissions"});
                            }

                            req.API.query("SELECT `IPs` FROM `arma_players` WHERE BINARY `Steam64ID`=?;", [Steam64ID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) return returnFalse(res, Option2); else if (results[0].IPs == null) return returnFalse(res, Option2); else {
                                    const Data = JSON.parse(await DecryptData(IPsKey, results[0].IPs));
                                    if (req.body.Total !== undefined) {
                                        return returnResults(res, Option2, {
                                            Total: Data.length,
                                            Data: Data.reverse()
                                        });
                                    } else return returnResults(res, Option2, Data.reverse());
                                }
                            });
                            break;

                        default: 
                            return res.json({Error: "Invalid Option2"})
                    }
                    break;

                default: 
                    return res.json({Error: "Invalid Option"})
            }
        }
        
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;