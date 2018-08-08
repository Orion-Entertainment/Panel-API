const CronJob = require('cron').CronJob;
const API = require('../../core/app').API;
const ServerDBs = require('../../core/app').ServerDBs;

/* Config */
const TimeZone = 'America/New_York';
const selectLimit = 100;
const Config = {
    "Arma3": {
        "RemoveOldHouses": true
    }
};


/* Weekly - Every sunday at midnight */
new CronJob('0 0 * * 0', function() {
    RemoveOldHouses();
    
    }, function () {
        return; /* This function is executed when the job stops */
    },
    true,
    TimeZone
);



RemoveOldHouses(); //One time for testing



/* Functions */
async function RemoveOldHouses() {
    try {
        if (Config.Arma3.RemoveOldHouses) {
            console.log('start')
            const SQL = ServerDBs.maldenlife2;

            const getTotalHouses = await SQL.query("SELECT COUNT(`id`) AS 'TotalHouses' FROM `houses` WHERE `owned`='1' AND (`insert_time` < NOW() - INTERVAL 1 MONTH);");
            if (getTotalHouses[0] == undefined) return;
            let TotalHouses = getTotalHouses[0].TotalHouses.length;

            if (TotalHouses < 1) return;
            else if (TotalHouses <= 100) setOffset = 0;
            else setOffset = selectLimit;

            if (setOffset < 1) loopTotal = 1;
            else loopTotal = Math.ceil(TotalHouses / setOffset);
            console.log(loopTotal)
            
            let Offset = setOffset;
            for (let i = 0; i < loopTotal; i++) {
                const getHouses = await SQL.query("SELECT `id`,`pid` FROM `houses` WHERE (`insert_time` < NOW() - INTERVAL 1 MONTH) ORDER BY `id` DESC LIMIT "+selectLimit+" OFFSET "+Offset);
                if (getHouses[0] == undefined) return;

                console.log(getHouses.length)
                for (let i = 0; i < getHouses.length; i++) {
                    HouseID = getHouses[i].id;
                    PID = getHouses[i].pid;

                    const checkPlayer = await API.query("SELECT `id` FROM `arma_players` WHERE BINARY `Steam64id`=? AND (`Last Seen` < NOW() - INTERVAL 1 MONTH)",[PID]);
                    if (checkPlayer[0] == undefined) return; else {
                        console.log(HousesID)
                        //await SQL.query("DELETE FROM `houses` WHERE `id`=?;",[HousesID]);
                    }

                    if (i + 1 == getHouses.length) {
                        Offset + setOffset; return;
                    }
                }
            }

        } else return;
    } catch (error) {
        console.log(error);
        return;
    }
}