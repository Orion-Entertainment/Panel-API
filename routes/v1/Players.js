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
        const Search = req.body.SearchVal;
        if (Search == "") return res.json({Error: "SearchVal Empty"})
        req.API.query("SELECT `id`,`Last Name`,`Steam64ID` FROM `arma_players` WHERE `Last Name` LIKE '%"+Search+"%' OR `GUID` LIKE '%"+Search+"%' OR `Steam64ID` LIKE '%"+Search+"%' ORDER BY `id` DESC LIMIT 25;", async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            if (results[0] == undefined) {
                //do a more lengthy search
                req.API.query("SELECT `id`,`Last Name`,`Steam64ID` FROM `arma_players` WHERE `Names` LIKE '%"+Search+"%' ORDER BY `id` DESC LIMIT 25;", async function (error, results, fields) {
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
            req.API.query("SELECT `id`,`Last Name`,`Names`,`Steam64ID`,`GUID`,`First Seen`,`Last Seen` FROM `arma_players` WHERE `id`=?;", [PlayerID], async function (error, results, fields) {
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
                            "Names": JSON.parse(Result["Names"]),
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

            switch (req.body.Option) {
                case "Get":
                    if (req.body.Option2 == undefined) return res.json({Error: "Option2 Undefined"})
                    else if (req.body.Option2 == "") return res.json({Error: "Option2 Invalid"})

                    switch (req.body.Option2) {
                        case "Bans":
                            const getGUID = await req.API.query("SELECT `GUID` FROM `arma_players` WHERE BINARY `id`=?", [PlayerID]);
                            if (getGUID[0] == undefined) return res.json({Error: "Failed Getting GUID"})
                            else {
                                req.API.query("SELECT `id`,`Server`,`Reason`,`Created`,`Expires` FROM `arma_bans` WHERE BINARY `GUID`=? ORDER BY `id` DESC LIMIT 20;", [getGUID[0].GUID], async function (error, results, fields) {
                                    if (error) {
                                        console.error(error)
                                        return res.json({Error: error})
                                    } else if (results[0] == undefined) {
                                        return res.json({
                                            "Bans": false
                                        }).end();
                                    } else {
                                        return res.send(results).end();
                                    }
                                });
                            }

                        default: 
                            return res.json({Error: "Invalid Option2"})
                    }

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