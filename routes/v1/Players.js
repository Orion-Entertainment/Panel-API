const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */

/* Added NPM Packages */

/* Functions */
async function EncryptData(key, data) {
    const cipher = crypto.createCipher('aes-256-cbc', key);
    let encrypted = cipher.update(data,'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
}
async function DecryptData(key, data) {
    const decipher = crypto.createDecipher('aes-256-cbc', key) 
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
        req.API.query("SELECT `id`,`Last Name`,`Steam64ID` FROM `arma_players` WHERE `Last Name` LIKE ? OR `GUID` LIKE ? OR `Steam64ID` LIKE ? ORDER BY `id` DESC LIMIT 25;", [Search,Search,Search], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            if (results[0] == undefined) {
                //do a more lengthy search
                req.API.query("SELECT `id`,`Last Name`,`Steam64ID` FROM `arma_players` WHERE `Names` LIKE ? ORDER BY `id` DESC LIMIT 25;", [Search], async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    }
                    
                    if (results[0] == undefined) {
                        return res.json({
                            "Results": false
                        }).end();
                    } else {
                        return res.json({
                            "Results": results
                        }).end();
                    }
                });
            } else {
                return res.json({
                    "Results": results
                }).end();
            }
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
                    } else if (results[0] == undefined) {
                        return res.json({
                            "Money": false
                        }).end();
                    } else {
                        return res.json({
                            "Money": results
                        }).end();
                    }
                });
                break;

            case "EXP":
                SQL.query("SELECT `name`,`pid`,`exp_level`,`exp_total`,`exp_perkPoints` FROM `players` ORDER BY `exp_level` DESC, `exp_total` DESC, `exp_perkPoints` DESC LIMIT 25;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    } else if (results[0] == undefined) {
                        return res.json({
                            "EXP": false
                        }).end();
                    } else {
                        return res.json({
                            "EXP": results
                        }).end();
                    }
                });
                break;

            case "GangFunds":
                SQL.query("SELECT `name`,`bank` FROM `gangs` ORDER BY `bank` DESC LIMIT 25;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    } else if (results[0] == undefined) {
                        return res.json({
                            "GangFunds": false
                        }).end();
                    } else {
                        return res.json({
                            "GangFunds": results
                        }).end();
                    }
                });
                break;

            case "Bounty":
                SQL.query("SELECT `wantedName`,`wantedBounty` FROM `wanted` ORDER BY `wantedBounty` DESC LIMIT 25;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    } else if (results[0] == undefined) {
                        return res.json({
                            "Bounty": false
                        }).end();
                    } else {
                        return res.json({
                            "Bounty": results
                        }).end();
                    }
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
        const PlayerID = req.body.PlayerID;

        if (req.body.Option == undefined) {
            if (PlayerID == "" | isNaN(PlayerID)) return res.json({Error: "PlayerID Invalid"})
            req.API.query("SELECT `id`,`Last Name`,`Steam64ID`,`GUID`,`First Seen`,`Last Seen` FROM `arma_players` WHERE `id`=?;", [PlayerID], async function (error, results, fields) {
                if (error) {
                    console.error(error)
                    return res.json({Error: error})
                } else if (results[0] == undefined) {
                    return res.json({
                        "Info": false
                    }).end();
                } else {
                    const Result = results[0];
                    return res.json({
                        "Info": {
                            "id": Result["id"],
                            "LastName": Result["Last Name"],
                            "Steam64ID": Result["Steam64ID"],
                            "GUID": Result["GUID"],
                            "FirstSeen": await moment(Result["First Seen"]).format('YYYY/MM/DD HH:mm:ss'),
                            "LastSeen": await moment(Result["Last Seen"]).format('YYYY/MM/DD HH:mm:ss')
                        }
                    }).end();
                }
            });
        } else {
            if (req.body.Option == "") return res.json({Error: "Option Invalid"})

            const getInfo = await req.API.query("SELECT `GUID`,`Steam64ID` FROM `arma_players` WHERE BINARY `id`=?", [PlayerID]);
            if (getInfo[0] == undefined) return res.json({Error: "Failed Getting Player Info"});
            const GUID = getInfo[0].GUID;
            const Steam64ID = getInfo[0].Steam64ID;

            switch (req.body.Option) {
                case "Get":
                    if (req.body.Option2 == undefined) return res.json({Error: "Option2 Undefined"})
                    else if (req.body.Option2 == "") return res.json({Error: "Option2 Invalid"})
                

                    switch (req.body.Option2) {
                        case "Names":
                            req.API.query("SELECT `Names` FROM `arma_players` WHERE BINARY `GUID`=? LIMIT 1;", [GUID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) {
                                    return res.json({
                                        "Names": false
                                    }).end();
                                } else {
                                    return res.json({
                                        "Names": JSON.parse(results[0].Names)
                                    }).end();
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
                                } else if (results[0] == undefined) {
                                    return res.json({
                                        "Bans": false
                                    }).end();
                                } else {
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
                                            return res.json({
                                                "Bans": Return
                                            }).end();
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
                                } else if (results[0] == undefined) {
                                    return res.json({
                                        "Kicks": false
                                    }).end();
                                } else {
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
                                            return res.json({
                                                "Kicks": Return
                                            }).end();
                                        }
                                    };
                                }
                            });
                            break;

                        case "Kills":
                            if (req.body.Option3 !== undefined) {
                                if (req.body.Option3 !== "") Kills = "`Killer`='"+Steam64ID+"' OR `Killed`='"+Steam64ID+"'"; else Kills = "`Killer`='"+Steam64ID+"'";
                            } else Kills = "`Killer`='"+Steam64ID+"'";
                            
                            if (Steam64ID == null) {
                                return res.json({
                                    "Kills": false
                                }).end();
                            }
                            req.API.query("SELECT `Server`,`KilledName`,`Killed`,`KilledGroup`,`Weapon`,`Time` FROM `arma_kills` WHERE BINARY "+Kills+" ORDER BY `id` DESC LIMIT 20;", async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) {
                                    return res.json({
                                        "Kills": false
                                    }).end();
                                } else {
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
                                            return res.json({
                                                "Kills": Return
                                            }).end();
                                        }
                                    };
                                }
                            });
                            break;

                        /* Servers */
                        case "MaldenLife":
                            if (Steam64ID == null) {
                                return res.json({
                                    "MaldenLife": false
                                }).end();
                            }
                            req.ServerDBs.maldenlife2.query("SELECT SUM(`bankacc`+`cash`) AS 'Money',`coplevel`,`mediclevel`,`donorlevel`,`exp_level`,`exp_total`,`exp_perkPoints` FROM `players` WHERE BINARY `pid`=?;", [Steam64ID], async function (error, results, fields) {
                                if (error) {
                                    console.error(error)
                                    return res.json({Error: error})
                                } else if (results[0] == undefined) {
                                    return res.json({
                                        "MaldenLife": false
                                    }).end();
                                } else if (results[0].Money == null) {
                                    return res.json({
                                        "MaldenLife": false
                                    }).end();
                                } else {
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