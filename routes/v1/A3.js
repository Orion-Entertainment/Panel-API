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
        const Option = JSON.parse(req.body["option"]);
        const Data = JSON.parse(req.body["data"]);

        switch (Option) {
            case "Log":
                const Action = Data[0];
                switch (Action) {
                    case "Killed":
                        const KilledName = Data[1];
                        const KilledPID = Data[2];
                        const KilledGroup = Data[3];
                        const KillerName = Data[4];
                        const KillerPID = Data[5];
                        const KillerWeapon = Data[6];
                        const KillerGroup = Data[7];
                        const KillDistance = Data[8];

                        const SaveData = JSON.stringify({
                            KilledName: KilledName,
                            KilledPID: KilledPID,
                            KilledGroup: KilledGroup,
                            KillerName: KillerName,
                            KillerPID: KillerPID,
                            KillerWeapon: KillerWeapon,
                            KillerGroup: KillerGroup,
                            KillDistance: KillDistance
                        });

                        req.API.query("INSERT INTO `servers_logs` (`Option`,`Action`,`Data`) VALUES(?,?,?);", [Option,Action,SaveData]);
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

module.exports = router;