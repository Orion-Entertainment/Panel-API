const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */
const ChangeLogData = "27246274bb79c13af1de1f2de82ccdd3";

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

/* Routers */
router.post('/', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.Option == undefined) return res.json({Error: "Option Undefined"})
        else if (req.body.Option == "") return res.json({Error: "Option Empty"})

        switch (req.body.Option) {
            case "Index":
                req.API.query("SELECT `id`,`Category`,`Name`,`Data`,`Time` FROM `changelogs` WHERE `Time`<NOW() LIMIT 15;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    }
                    
                    return res.send(results);
                });
                break;

            case "Admin":
                req.API.query("SELECT `id`,`Category`,`Name`,`Data`,`Time` FROM `changelogs` LIMIT 10;", async function (error, results, fields) {
                    if (error) {
                        console.error(error)
                        return res.json({Error: error})
                    }
                    
                    return res.send(results);
                });
                break;

            case "Create":
                if (req.body.Name == undefined | req.body.Category == undefined | req.body.Time == undefined | req.body.Data == undefined) return res.json({Error: "Input Undefined"})
                else if (req.body.Name == "" | req.body.Category == "" | req.body.Time == "" | req.body.Data == "") return res.json({Error: "Input empty"})
                else {
                    const ENCData = await EncryptData(ChangeLogData, JSON.stringify(req.body.Data));
                    req.API.query("INSERT INTO `changelogs` (`Category`,`Name`,`Data`,`Time`) VALUES(?,?,?,?);", [req.body.Category,req.body.Name,ENCData,req.body.Time], async function (error, results, fields) {
                        if (error) {
                            console.error(error)
                            return res.json({Error: error})
                        }
                        
                        return res.send("Success");
                    });
                }
                break;
            default:
                return res.json({Error: "Invalid Option"})
        }
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;