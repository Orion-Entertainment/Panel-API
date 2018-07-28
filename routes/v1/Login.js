const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */
const IPKey = '23c75c2073e06aefc59278be2cc59cd9';
const NameKey = 'f4b4f10543810f6c6983576fe291c11f';
const EmailKey = '9f5e31765acb477bcb260ac1706d7719';
const Steam64IDKey = 'f8ed9462be58f755a98646cbad9c48d5';

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

function QueryableEncrypt(data, key) {
    return "AES_ENCRYPT('"+data+"', '"+key+"')";
}
function QueryableDecrypt(column, key) {
    return "CONVERT(AES_DECRYPT(`"+column+"`, '"+key+"') using utf8) AS '"+column+"'";
};

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
        else if (Data.Email == false | Data.Email == "") Email = null; else Email = Data.Email;

        const Now = await moment(new Date()).format('YYYY/MM/DD HH:mm:ss');

        switch (req.body.Option) {
            case "Steam":
                if (Data.Steam64ID == undefined) return res.json({Error: "Steam64ID Undefined"})
                if (Data.Steam64ID == "" | isNaN(Data.Steam64ID)) return res.json({Error: "Steam64ID Invalid"})

                req.API.query("INSERT INTO `accounts` (`Name`,`Names`,`Email`,`Steam64ID`,`LastIP`,`IPs`) VALUES(?,?,?,?,?,?);", [await QueryableEncrypt(Data.Name, NameKey),JSON.stringify([{Name: Data.Name, Time: Now}]),await QueryableEncrypt(Email, EmailKey),await QueryableEncrypt(Data.Steam64ID, Steam64IDKey),await QueryableEncrypt(req.body.IP, IPKey),JSON.stringify([{IP: req.body.IP, Time: Now}])], async function (error, results, fields) {
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