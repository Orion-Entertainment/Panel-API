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
        } else if (req.body["option"] == undefined | req.body["data"] == undefined) {
            return res.send("Invalid Login");
        }

        return res.send("Success");
    } catch (error) {
        console.log(error)
        return res.send("API Error");
    }
});

//For Arma 3 Server Extension
router.post('/Addon', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 
        
        
        if (req.body["option"] == undefined | req.body["data"] == undefined) {
            return res.send("Invalid Login");
        }

        const TokenData = await req.GetData(req.body["client_id"], req.body["token"]);
        if (TokenData == undefined) {
            return res.send("Invalid Login")
        } else if (TokenData.Server == false) {
            return res.send("Invalid Login")
        } else {
            const ServerName = JSON.parse(TokenData).Server;
            const Option = JSON.parse(req.body["option"]);
            if (/<NULL-object>|B Alpha 1-\d:\d+/g.test(req.body["data"])) {
                const fix = await req.body["data"].match(/(.+)(<NULL-object>|B Alpha 1-\d:\d+)(.+)/);
                Data = JSON.parse(fix[1]+'""'+fix[3]);
            } else {
                Data = JSON.parse(req.body["data"]);
            }

            switch (Option) {
                case "Log":
                    const Action = Data[0];
                    switch (Action) {
                        case "Killed":
                            let KilledName = Data[1];
                            const KilledPID = Data[2];
                            let KilledGroup = Data[3];
                            let KillerName = Data[4];
                            let KillerPID = Data[5];
                            let Weapon = Data[6];
                            let KillerGroup = Data[7];
                            let Distance = Data[8];

                            //Changes some values to null
                            if (KilledGroup == "" | KilledGroup == "No Group" | KilledGroup == "No Gang") KilledGroup = null;
                            if (KillerGroup == "" | KillerGroup == "No Group" | KillerGroup == "No Gang") KillerGroup = null;
                            if (KilledName == "") KilledName = null;
                            if (KillerName == "") KillerName = null;
                            if (KillerPID === "") KillerPID = null;
                            if (Weapon == "") Weapon = null;
                            if (Distance < 0) Distance = 0;

                            req.API.query("INSERT INTO `arma_kills` (`Server`,`KillerName`,`Killer`,`KillerGroup`,`KilledName`,`Killed`,`KilledGroup`,`Weapon`,`Distance`) VALUES(?,?,?,?,?,?,?,?,?);", [ServerName,KillerName,KillerPID,KillerGroup,KilledName,KilledPID,KilledGroup,Weapon,Distance]);
                            return res.send("Success");

                        case "Withdraw":
                            const PID = Data[1];
                            const Amount = Data[2];

                            req.API.query("INSERT INTO `arma_money` (`Server`,`Option`,`PID`,`Amount`) VALUES(?,?,?,?);", [ServerName,"Withdraw",PID,Amount]);
                            return res.send("Success");

                        case "Deposit":
                            const PID = Data[1];
                            const Amount = Data[2];

                            req.API.query("INSERT INTO `arma_money` (`Server`,`Option`,`PID`,`Amount`) VALUES(?,?,?,?);", [ServerName,"Deposit",PID,Amount]);
                            return res.send("Success");

                        default:
                            console.log("Invalid Log Action: ",Action,Option,Data)
                            return res.send("Invalid Log Action: "+Action);
                    }
                
                default:
                    return res.send("Invalid Option: "+Option);
            }
        };
    } catch (error) {
        return res.send("API Error");
    }
});

router.post('/Killfeed', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) return res.send("Invalid Login"); 


        if (req.body["option"] == undefined | req.body["data"] == undefined) {
            return res.send("Invalid Login");
        }

        if (req.body.server == undefined) {
            const getRecentKills = req.API.query("SELECT * FROM `arma_kills` ORDER BY `Time` DESC LIMIT 20");
            if (getRecentKills[0] == undefined) {
                return false;
            } else {
                /* Will comeback to this tomorrow once there is more kills logged */
            }
        }
    } catch (error) {
        console.log(error)
        return res.send("API Error");
    }
});

module.exports = router;