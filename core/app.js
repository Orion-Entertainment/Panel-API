const express = require('express'); const app = express();
const mysql = require('promise-mysql');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const config = require('./config.json');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.enable('trust proxy');

/* Database Pools */
const API = mysql.createPool({
    host: config.API.host,
    user: config.API.user,
    password: config.API.password,
    database: config.API.database,
    port: config.API.port,
    connectionLimit: config.API.connectionLimit,
});



const APITokenKey = 'M6uPseis3w8peRrKMdKhNKuoIk5X27Tn';

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

app.use((req, res, next) => {
    req.Check = async function(ClientID, Token) {
        if (ClientID == undefined | Token == undefined) {return false;}
        
        const token = await EncryptData(APITokenKey, Token);
        const Query = req.API.query("SELECT `client_id` FROM `login` WHERE `client_id`=? AND BINARY `token`=?;", [ClientID, token]);
        if (Query[0] == undefined) {return false;} else {return true;}
    };

    req.API = API;
    next();
});


/* Routes */
const v1 = require('../routes/v1'); app.use('/v1', v1);


// catch 404 and forward to error handler
app.use((req, res, next) => {
    const err = new Error('Not Found');
    err.status = 404;
    next(err);
});

//Cloudflare to get IPs
const cloudflare = require('cloudflare-express');
app.use(cloudflare.restore());

// error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500);

    res.send(err);
    //res.send(err.message);
});

module.exports = app;
module.exports.API = API;