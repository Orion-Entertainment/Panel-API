const express = require('express');
const router = express.Router();
const moment = require('moment');

/* Set Variables */

/* Added NPM Packages */

/* Functions */

/* Routers */
router.post('/GetData', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);

        if (TokenData == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel == undefined) return res.json({Error: "Access Denied"})
        else if (JSON.parse(TokenData).Panel !== true) return res.json({Error: "Access Denied"})

        return res.json({
            TotalPlayers: 10069
        });
        if (req.body.limit !== undefined) limit = req.body.limit; else limit = 15;
        req.API.query("SELECT `id`,`Category`,`Name`,`Data`,`Time` FROM `changelogs` WHERE `Time`<NOW() ORDER BY `id` DESC LIMIT "+limit+";", async function (error, results, fields) {
            if (error) {
                console.error(error)
                return res.json({Error: error})
            }
            
            return res.send(results);
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;