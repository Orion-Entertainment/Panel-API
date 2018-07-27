const express = require('express');
const app = express();

const API = require('./v1/API'); app.use('/API', API);
const Login = require('./v1/Login'); app.use('/Login', Login);
const A3 = require('./v1/A3'); app.use('/A3', A3);

module.exports = app;