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
        const Option = req.body["option"].replace(/["]/g, "");
        const Data = req.body["data"];

        switch (Option) {
            case "Log":
                const Action = Data[0];
                switch (Action) {
                    case "Killed":
                        const KillerName = Data[1];
                        const KillerPID = Data[2];
                        console.log(Data)
                        console.log(KillerName,KillerPID)

                        if (KillerName === undefined | KillerPID === undefined) {return res.send("Invalid Log Data");}

                        const SaveData = JSON.stringify({
                            KillerName: KillerName,
                            KillerPID: KillerPID
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
        return res.send("API Error");
    }
});

module.exports = router;