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
router.post('/Create', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 


        if (req.body.data == undefined) return res.send("data undefined").end();

        const tokenPart1 = await randomString({
            length: 32,
            numeric: true,
            letters: true,
            special: false
        });
        const tokenPart2 = await randomString({
            length: 32,
            numeric: true,
            letters: true,
            special: false
        });

        const token = tokenPart1+"-"+tokenPart2;
        const data = req.body.data;

        const tokenENC = await EncryptData(APITokenKey,token);
        const dataENC = await EncryptData(token,data);

        req.API.query("INSERT INTO `login` (`token`,`data`) VALUES(?,?);", [tokenENC, dataENC], function (error, results, fields) {
            if (error) throw error;
            return res.json({
                "client_id": results.insertId,
                "token": token,
                "data": data
            }).end();
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "API Error"}).end();
    }
});

router.post('/Check', async(req, res, next) => {
    try {
        /* Check Token */
        if (req.body["client_id"] == undefined | req.body["token"] == undefined) {
            return res.send("client_id or token undefined");
        }
        
        const token = await EncryptData(APITokenKey,req.body["token"]);
        req.API.query("SELECT `data` FROM `login` WHERE `client_id`=? AND BINARY `token`=?;", [req.body["client_id"], token], async function (error, results, fields) {
            if (error) throw error;
            
            if (results[0] !== undefined) {
                const dataDEC = await DecryptData(req.body["token"],results[0].data);

                return res.json({
                    "Check": true,
                    "data": dataDEC
                }).end();
            } else {
                return res.json({
                    "Check": false
                }).end();
            }
        });
    } catch (error) {
        console.log(error)
        return res.send("API Error");
    }
});

module.exports = router;