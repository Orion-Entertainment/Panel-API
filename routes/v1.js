const express = require('express');
const app = express();

const API = require('./v1/API'); app.use('/API', API);
const Login = require('./v1/Login'); app.use('/Login', Login);
const A3 = require('./v1/A3'); app.use('/A3', A3);
const Players = require('./v1/Players'); app.use('/Players', Players);
const Shop = require('./v1/Shop'); app.use('/Shop', Shop);

module.exports = app;