const express = require('express');
const app = express();

const API = require('./v1/API'); app.use('/API', API);
const Arma = require('./v1/Arma'); app.use('/Arma', Arma);

module.exports = app;