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

        const Categories = [{
            "ID": 1,
            "Name": "Arma 3",
            "IMG": "/Shop/Category/Arma3.png"
        },{
            "ID": 2,
            "Name": "Teamspeak",
            "IMG": "/Shop/Category/Teamspeak.png"
        }];

        return res.send(Categories);

        /*req.API.query("SELECT `id`,`Last Name`,`Steam64ID` FROM `arma_players` WHERE `Last Name` LIKE ? OR `GUID` LIKE ? OR `Steam64ID` LIKE ? OR `Names` LIKE ?  ORDER BY `id` DESC LIMIT 25;", [Search,Search,Search,Search], async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            if (results[0] == undefined) return returnFalse(res, "Results"); else return returnResults(res, "Results", results);
        });*/
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;