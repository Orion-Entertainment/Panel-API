const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */
const ChangeLogDataKEY = "27246274bb79c13af1de1f2de82ccdd3";

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

        req.API.query("SELECT `id`,`Category`,`Name`,`Data`,`Time` FROM `changelogs` WHERE `Time`<NOW() ORDER BY `id` DESC LIMIT 15;", async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            return res.send(results);
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/Create', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.Name == undefined | req.body.Category == undefined | req.body.Time == undefined | req.body.Data == undefined) return res.json({Error: "Input Undefined"})
        else if (req.body.Name == "" | req.body.Category == "" | req.body.Time == "" | req.body.Data == "") return res.json({Error: "Input empty"})
        else {
            const ENCData = await EncryptData(ChangeLogDataKEY, JSON.stringify(req.body.Data));
            req.API.query("INSERT INTO `changelogs` (`Category`,`Name`,`Data`,`Time`) VALUES(?,?,?,?);", [req.body.Category,req.body.Name,ENCData,req.body.Time], async function (error, results, fields) {
                if (error) {
                    console.error(error)
                    return res.json({Error: error})
                }
                
                return res.send("Success");
            });
        }
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/Admin', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        req.API.query("SELECT `id`,`Category`,`Name`,`Data`,`Time` FROM `changelogs` ORDER BY `id` DESC LIMIT 10;", async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            return res.send(results);
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/View', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.ID == undefined) return res.json({Error: "ID Undefined"})
        else if (req.body.ID == "") return res.json({Error: "ID Empty"})
        else if (isNaN(req.body.ID)) return res.json({Error: "ID Invalid"})

        req.API.query("SELECT `id`,`Category`,`Name`,`Data`,`Time` FROM `changelogs` WHERE `Time`<NOW() AND `id`=? LIMIT 1;", [req.body.ID], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            } else if(results[0] == undefined) return res.json({Error: "Changelog not found"}); else {
                return res.json({
                    ID: results[0].Category,
                    Category: results[0].Category,
                    Name: results[0].Name,
                    Data: JSON.parse(await DecryptData(ChangeLogDataKEY, results[0].Data)),
                    Time: await moment(results[0].Time).format('YYYY/MM/DD HH:mm'),
                });
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;