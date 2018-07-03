const express = require('express'); const app = express();
const mysql = require('promise-mysql');
const config = require('./config.json');

const bodyParser = require('body-parser');
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

app.use((req, res, next) => {
    req.API = API;
    next();
});


/* Routes */
const index = require('../routes/index');
    app.use('/', index);


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