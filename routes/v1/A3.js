const express = require('express');
const router = express.Router();

/* Set Variables */

/* Added NPM Packages */

/* Functions */

/* Routers */
router.post('/Check', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) {
            return res.send("Invalid Login");
        }

        console.log(req.headers['cf-connecting-ip']);
        console.log(req);
        return res.send("Success");
    } catch (error) {
        console.log(error)
        return res.send("API Error");
    }
});

module.exports = router;