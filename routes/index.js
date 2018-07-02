const express = require('express');
const router = express.Router();

router.post('/', async(req, res, next) => {
    try {
        /* Check Token */
        
        return res.json({Success: "Valid Token"}).end();
    } catch (error) {
        console.error(error);
        return res.json({Error: "API Error"}).end();
    }
});

module.exports = router;