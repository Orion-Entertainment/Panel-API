const express = require('express');
const router = express.Router();

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

router.post('/', async(req, res, next) => {
    try {
        /* Check Token */
        
        return res.json({Success: "Valid Token /v1/API"}).end();
    } catch (error) {
        return res.json({Error: "API Error"}).end();
    }
});

router.post('/Create', async(req, res, next) => {
    try {
        /* Check Token */
        
        
        const clientID = await randomString({
            length: 16,
            numeric: true,
            letters: true,
            special: false
        });

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

        const tokenENC = await EncryptData('M6uPseis3w8peRrKMdKhNKuoIk5X27Tn',token);

        const Data = JSON.stringify({
            Testing: true
        });

        req.API.query("INSERT INTO `login` (`token`,`data`) VALUES(?,?);", [tokenENC, Data], function (error, results, fields) {
            if (error) throw error;
            return res.json({
                "client_id": results.insertId,
                "token": token
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
        
        const token = await EncryptData('M6uPseis3w8peRrKMdKhNKuoIk5X27Tn',req.body["token"]);

        req.API.query("SELECT `data` FROM `login` WHERE `client_id`=? AND `token`=?;", [req.body["client_id"], token], function (error, results, fields) {
            if (error) throw error;
            console.log(results)
            return res.json({
                "client_id": results.insertId,
                "token": token
            }).end();
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "API Error"}).end();
    }
});

module.exports = router;