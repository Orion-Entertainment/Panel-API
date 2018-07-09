const express = require('express');
const app = express();

const API = require('./v1/API'); app.use('/API', API);

module.exports = app;