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

        if (req.body.SearchVal == undefined)  return res.json({Error: "SearchVal Undefined"})
        if (req.body.SearchVal == "")  return res.json({Error: "SearchVal Empty"})
        req.API.query("SELECT `id` FROM `arma_players` WHERE `Last Name` LIKE '%?%' OR `GUID` LIKE '%?%' OR `Steam64ID` LIKE '%?%';",[req.body.SearchVal,req.body.SearchVal,req.body.SearchVal], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            if (results[0] == undefined) {
                //do a more lengthy search
                req.API.query("SELECT `id` FROM `arma_players` WHERE `Names` LIKE '%?%';",[req.body.SearchVal], async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    }
                    
                    if (results[0] == undefined) {
                        return res.json({
                            "Search": false
                        }).end();
                    } else {
                        const Result = results[0];
                        return res.json({
                            "Search": true,
                            "ID": Result["id"]
                        }).end();
                    }
                });
            } else {
                const Result = results[0];
                return res.json({
                    "Search": true,
                    "ID": Result["id"]
                }).end();
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;