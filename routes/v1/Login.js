const express = require('express');
const router = express.Router();

/* Set Variables */
const APITokenKey = 'M6uPseis3w8peRrKMdKhNKuoIk5X27Tn';

/* Added NPM Packages */
const crypto = require('crypto');
const randomString = require('random-string');

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

/* Routers */
router.post('/Verify', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})
        else if (req.body["Option"] == undefined) return res.json({Error: "Option Undefined"})
        else if (req.body["Option"] == "") return res.json({Error: "Option Empty"})

        switch (req.body["Option"]) {
            case "Steam":
                if (req.body["Steam64ID"] == undefined) return res.json({Error: "Steam64ID Undefined"})
                else if (req.body["Steam64ID"] == "") return res.json({Error: "Steam64ID Empty"})

                req.API.query("SELECT `id` FROM `account` WHERE BINARY `Steam64ID`=?;", [req.body["Steam64ID"]], async function (error, results, fields) {
                    if (error) 
                        console.log(error)
                        return res.json({Error: error})
                    
                    if (results[0] == undefined) {
                        return res.json({
                            "Check": false
                        }).end();
                    } else {
                        return res.json({
                            "Check": true,
                            "ID": results[0].id
                        }).end();
                    }
                });
        }
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;