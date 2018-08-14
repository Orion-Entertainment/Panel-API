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

        /* Players */
        const totalPlayers = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_players` LIMIT 1;");
        const totalPlayersNewMonth = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_players` WHERE (`First Seen` > NOW() - INTERVAL 1 MONTH) LIMIT 1;");
        const totalPlayersMonth = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_players` WHERE (`Last Seen` > NOW() - INTERVAL 1 MONTH) LIMIT 1;");
        const totalBans = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_bans` WHERE (`Created` > NOW() - INTERVAL 1 MONTH) LIMIT 1;");

        /* Kills */
        const totalKills = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_kills` WHERE `killer`!=`killed` LIMIT 1;");
        const totalKillsCop = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_kills` WHERE `killer` IS NOT NULL AND `killer`!=`killed` AND `KillerGroup`='Police' LIMIT 1;");
        const totalKillsCivilians = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_kills` WHERE `killer` IS NOT NULL AND `killer`!=`killed` AND `KillerGroup`!='Police' LIMIT 1;");
        const totalKillsSuicide = await req.API.query("SELECT COUNT(`id`) AS 'Total' FROM `arma_kills` WHERE `killer`=`killed` LIMIT 1;");

        return res.json({
            TotalPlayers: {
                Total: totalPlayers[0].Total.toLocaleString(),

                TotalNewMonth: totalPlayersNewMonth[0].Total,
                TotalMonth: totalPlayersMonth[0].Total,
                TotalBans: totalBans[0].Total
            },
            Kills: {
                Total: totalKills[0].Total.toLocaleString(),

                Cops: totalKillsCop[0].Total,
                Civilians: totalKillsCivilians[0].Total,
                Suicide: totalKillsSuicide[0].Total
            }
        });
    } catch (error) {
        console.log(error)
        return res.json({Error: "Error"})
    }
});

module.exports = router;