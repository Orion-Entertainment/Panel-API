const express = require('express');
const router = express.Router();
const moment = require('moment');

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

        const Check = req.body.Option;
        if (Check == undefined) return res.json({Error: "Option Undefined"})
        else if (Check.Option == undefined) return res.json({Error: "Option Undefined"})
        else if (Check.Option == "") return res.json({Error: "Option Empty"})

        switch (Check.Option) {
            case "Steam":
                if (Check.SteamID == undefined) return res.json({Error: "SteamID Undefined"})
                else if (Check.SteamID == "") return res.json({Error: "SteamID Empty"})

                req.API.query("SELECT `id` FROM `accounts` WHERE BINARY `Steam64ID`=?;", [Check.SteamID], async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    }
                    
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

router.post('/Register', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})
        else if (req.body.Option == undefined) return res.json({Error: "Option Undefined"})
        else if (req.body.Option == "") return res.json({Error: "Option Empty"})
        else if (req.body.IP == undefined) return res.json({Error: "IP Undefined"})
        else if (req.body.IP == "") return res.json({Error: "IP Empty"})
        else if (req.body.Data == undefined) return res.json({Error: "Data Undefined"})
        const Data = JSON.parse(req.body.Data);
        if (Data.Name == undefined) return res.json({Error: "Name Undefined"})
        else if (Data.Name == "") return res.json({Error: "Name Empty"})
        else if (Data.Email == undefined) return res.json({Error: "Email Undefined"})
        else if (Data.Email == false | req.body.Data.Email == "") Email = null;

        const Now = await moment(new Date()).format('YYYY/MM/DD HH:mm:ss');

        switch (req.body.Option) {
            case "Steam":
                if (req.body.Data.Steam64ID == undefined) return res.json({Error: "Steam64ID Undefined"})
                if (req.body.Data.Steam64ID == "" | !isNaN(req.body.Data.Steam64ID)) return res.json({Error: "Steam64ID Invalid"})

                req.API.query("INSERT INTO `accounts` (`Name`,`Names`,`Email`,`Steam64ID`,`LastIP`,`IPs`) VALUES(?,?,?,?,?,?);", [req.body.Data.Name,[{Name: req.body.Data.Name, Time: Now}],Email,req.body.Data.Steam64ID,req.body.IP,[{IP: req.body.IP, Time: Now}]], async function (error, results, fields) {
                    if (error) {
                        if (error = "ER_DUP_ENTRY") {
                            return res.send("Already Registered")
                        } else {
                            console.error(error)
                            return res.json({Error: error})
                        }
                    } else {
                        return res.json({
                            "ID": results.insertId
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