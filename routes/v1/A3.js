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
        if (CheckLogin == false) {
            return res.send("Invalid Login");
        } else if (req.body["option"] == undefined | req.body["data"] == undefined) {
            return res.send("Invalid Login");
        }

        switch (req.body["client_id"]) {
            case 1:
                server = "MaldenLife";
        }


        const Option = JSON.parse(req.body["option"]);
        if (/<NULL-object>|B Alpha 1-\d:\d+/g.test(req.body["data"])) {
            const fix = await req.body["data"].match(/(.+)(<NULL-object>|B Alpha 1-\d:\d+)(.+)/);
            Data = fix[1]+'""'+fix[3];
        } else {
            Data = JSON.parse(req.body["data"]);
        }

        switch (Option) {
            case "Log":
                const Action = Data[0];
                switch (Action) {
                    case "Killed":
                        //const KilledName = Data[1];
                        const KilledPID = Data[2];
                        let KilledGroup = Data[3];
                       // const KillerName = Data[4];
                        let KillerPID = Data[5];
                        let Weapon = Data[6];
                        let KillerGroup = Data[7];
                        let Distance = Data[8];

                        if (KilledGroup == "" | KilledGroup == "No Group" | KilledGroup == "No Gang") {
                            KilledGroup = null;
                        };
                        if (KillerPID === "") {
                            KillerPID = null;
                        };
                        if (KillerGroup == "" | KilledGroup == "No Group" | KilledGroup == "No Gang") {
                            KillerGroup = null;
                        };
                        if (Weapon == "") {
                            Weapon = null;
                        };
                        if (Distance < 0) {
                            Distance = 0;
                        };

                        req.API.query("INSERT INTO `arma_kills` (`Server`,`Killer`,`KillerGroup`,`Killed`,`KilledGroup`,`Weapon`,`Distance`) VALUES(?,?,?,?,?,?,?);", [server,KillerPID,KillerGroup,KilledPID,KilledGroup,Weapon,Distance]);
                        return res.send("Success");

                    default:
                        return res.send("Invalid Log Action: "+Action);
                }
            
            default:
                return res.send("Invalid Option: "+Option);
        }
        
    } catch (error) {
        console.log(error)
        console.log(req.body)
        return res.send("API Error");
    }
});


router.post('/Killfeed', async(req, res, next) => {
    try {
        /* Check Login */
        const CheckLogin = await req.Check(req.body["client_id"], req.body["token"]);
        if (CheckLogin == false) {
            return res.send("Invalid Login");
        } else if (req.body["option"] == undefined | req.body["data"] == undefined) {
            return res.send("Invalid Login");
        }

        const getRecentKills = req.API.query("SELECT * FROM `arma_kills` WHERE", []);
        if (getRecentKills[0] == undefined) {
            return [];
        } else {

        }

    } catch (error) {
        console.log(error)
        return res.send("API Error");
    }
});

module.exports = router;