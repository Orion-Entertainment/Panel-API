const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */
const IPsKey = "7831b0e33a16c72716ef2e2f5f7d2803";

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

function QueryableEncrypt(data, key) {
    return "AES_ENCRYPT('"+data+"', '"+key+"')";
}
function QueryableDecrypt(column, key) {
    return "CONVERT(AES_DECRYPT(`"+column+"`, '"+key+"') using utf8) AS '"+column+"'";
};

function formatNumber(number) {
    if (number == null) return null;
    else return number.toLocaleString();
}

function returnFalse(res, Name) {
    return res.json({
        [Name]: false
    }).end();
}

function returnResults(res, Name, Results) {
    return res.json({
        [Name]: Results
    }).end();
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

        req.API.query("SELECT `Name`,`IMG` FROM `shop_categories` WHERE `Active`='True' ORDER BY `id` ASC;", async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            if (results[0] == undefined) return res.json({Categories: false}); else return res.json({Categories: results});
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

router.post('/Category', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        if (req.body.Category == undefined) return res.json({Error: "Category Undefined"})
        else if (req.body.Category == "") return res.json({Error: "Category Empty"})

        req.API.query("SELECT `id`,`Name`,`IMG`,`Price`,`ShortDescription` FROM `shop_items` WHERE `Active`='True' AND BINARY `Category`=? ORDER BY `id` ASC;", [req.body.Category], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            if (results[0] == undefined) return res.json({Category: false}); else return res.json({Category: results});
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;