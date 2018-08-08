const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */
const IPKey = '23c75c2073e06aefc59278be2cc59cd9';
const NameKey = 'f4b4f10543810f6c6983576fe291c11f';
const EmailKey = '9f5e31765acb477bcb260ac1706d7719';
const Steam64IDKey = 'f8ed9462be58f755a98646cbad9c48d5';
const KeyEncrypt = '384cd8e902f924498a8349c93b75f39c';

/* Added NPM Packages */
const crypto = require('crypto');
const randomString = require("randomstring");

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
        else if (req.body.IP == undefined) return res.json({Error: "IP Undefined"})
        else if (req.body.IP == "") return res.json({Error: "IP Empty"})

        const Now = await moment(new Date()).format('YYYY/MM/DD HH:mm:ss');

        switch (Check.Option) {
            case "Steam":
                if (Check.SteamID == undefined) return res.json({Error: "SteamID Undefined"})
                else if (Check.SteamID == "") return res.json({Error: "SteamID Empty"})

                req.API.query("SELECT `id`,"+await QueryableDecrypt("LastIP", IPKey)+",`IPs`,`isStaff`,CONVERT(`Key` using utf8) AS 'Key' FROM `accounts` WHERE BINARY `Steam64ID`="+await QueryableEncrypt(Check.SteamID, Steam64IDKey)+";", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    }
                    
                    if (results[0] == undefined) {
                        return res.json({
                            "Check": false
                        }).end();
                    } else {
                        const Result = results[0];
                        const Key = await DecryptData(KeyEncrypt, Result["Key"]);
                        if (Result["isStaff"] == "True") isStaff = true; else isStaff = false;

                        res.json({
                            "Check": true,
                            "ID": Result.id,
                            "isStaff": isStaff
                        }).end();

                        //Update IP if new one
                        const IP = req.body.IP;
                        if (Result["LastIP"] !== IP) {
                            let IPs = [];
                            if (Result["IPs"] !== null) {
                                IPs = JSON.parse(await DecryptData(Key, Result["IPs"]));
                            } else {
                                IPs = [];
                            }
                
                            if (IPs.length > 0) {
                                for (let i = 0; i < IPs.length; i++) {
                                    if (IPs[i].IP == IP) {
                                        IPs.splice(i,1);
                                        IPs.push({
                                            IP: IP,
                                            Time: Now
                                        });
                                    } else if (i + 1 == IPs.length) {
                                        IPs.push({
                                            IP: IP,
                                            Time: Now
                                        });
                                    }
                                }
                            } else {
                                IPs.push({
                                    IP: IP,
                                    Time: Now
                                });
                            }
                
                            if (IPs.length > 20) { //Max to save = 20
                                IPs.splice(0,1);
                            }
                            const IPsENC = await EncryptData(Key, JSON.stringify(IPs));
                            await req.API.query("UPDATE `accounts` set `LastIP`=?,`IPs`=? WHERE BINARY `id`=?;", [IP,IPsENC,Result.id]);
                        }


                        return;
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
        else if (Data.Name.length > 20) return res.json({Error: "Name cant be > 20 Characters"})
        else if (Data.Email == undefined) return res.json({Error: "Email Undefined"})
        else if (Data.Email == false | Data.Email == "") Email = null; else Email = Data.Email;

        const Now = await moment(new Date()).format('YYYY/MM/DD HH:mm:ss');
        const Key = await randomString.generate(32);
        const KeyENC = await EncryptData(KeyEncrypt, Key);
        const Names = JSON.stringify([{Name: Data.Name, Time: Now}]);
        const NamesENC = await EncryptData(Key, Names);
        const IPs = JSON.stringify([{IP: req.body.IP, Time: Now}]);
        const IPsENC = await EncryptData(Key, IPs);

        if (Email == null) setEmail = null; else setEmail = await QueryableEncrypt(Email, EmailKey);

        switch (req.body.Option) {
            case "Steam":
                if (Data.Steam64ID == undefined) return res.json({Error: "Steam64ID Undefined"})
                if (Data.Steam64ID == "" | isNaN(Data.Steam64ID)) return res.json({Error: "Steam64ID Invalid"})

                req.API.query("INSERT INTO `accounts` (`Name`,`Names`,`Email`,`Steam64ID`,`LastIP`,`IPs`,`Key`) VALUES("+await QueryableEncrypt(Data.Name, NameKey)+",?,"+setEmail+","+await QueryableEncrypt(Data.Steam64ID, Steam64IDKey)+","+await QueryableEncrypt(req.body.IP, IPKey)+",?,?);", [NamesENC,IPsENC,KeyENC], async function (error, results, fields) {
                    if (error) {
                        if (error == "ER_DUP_ENTRY") {
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