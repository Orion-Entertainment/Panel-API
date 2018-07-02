const express = require('express'); const app = express();
const mysql = require('promise-mysql');
const config = require('../core/config.json');
const crypto = require('crypto');
const moment = require('moment');

const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.enable('trust proxy');

/* Database Pools */
/*const API = mysql.createPool({
    host: config.DB.API.host,
    user: config.DB.API.user,
    password: config.DB.API.password,
    database: config.DB.API.database,
    port: config.DB.API.port,
    connectionLimit: config.DB.API.connectionLimit,
});*/

/* Sessions */
/*const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const sessionStore = new MySQLStore({
    checkExpirationInterval: config.SessionStore.checkExpirationInterval, //Currently: 2 Min
    expiration: config.SessionStore.expiration, //Currently: 5 Min
    createDatabaseTable: true,
}, API);
app.use(session({
    name: 'OrionPanelAPI',
    secret: '40b129ca01d3f1e41b5fc9ec6b1b9a6fc28232f9108e3e8821db752b4fefbbaa',
    saveUninitialized: false,
    resave: true,
    cookie: {
        secure: true,
        maxAge: config.SessionStore.expiration,
        expires: new Date(Date.now() + config.SessionStore.expiration)
    },
    store: sessionStore
}));*/

app.use((req, res, next) => {
    //req.API = API;
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