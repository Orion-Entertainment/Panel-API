const CronJob = require('cron').CronJob;
const API = require('../../core/app').API;
const ServerDBs = require('../../core/app').ServerDBs;

/* Config */
const TimeZone = 'America/New_York';
const selectLimit = 100;
const Config = {
    "Arma3": {
        "RemoveOldHouses": false
    }
};

/* Crons */
//Weekly - Every sunday at midnight
new CronJob('0 0 * * 0', function() {
    RemoveOldHouses();
    
    }, function () {
        return; /* This function is executed when the job stops */
    },
    true,
    TimeZone
);




/* Functions */
async function RemoveOldHouses() {
    try {
        if (Config.Arma3.RemoveOldHouses) {
            const SQL = ServerDBs.maldenlife2;

            const getTotalHouses = await SQL.query("SELECT COUNT(`id`) AS 'TotalHouses' FROM `houses` WHERE `owned`='1' AND (`insert_time` < NOW() - INTERVAL 1 MONTH);");
            if (getTotalHouses[0] == undefined) return;
            const TotalHouses = getTotalHouses[0].TotalHouses;

            let setOffset;
            if (TotalHouses < 1) return;
            else if (TotalHouses <= 100) setOffset = 0;
            else setOffset = selectLimit;

            if (setOffset < 1) loopTotal = 1;
            else loopTotal = Math.round(TotalHouses / setOffset);
            
            let Offset = 0;
            for (let i = 0; i < loopTotal; i++) {
                const getHouses = await SQL.query("SELECT `id`,`pid` FROM `houses` WHERE `owned`='1' AND (`insert_time` < NOW() - INTERVAL 1 MONTH) LIMIT "+selectLimit+" OFFSET "+Offset);

                if (getHouses[0] !== undefined) {
                    for (let h = 0; h < getHouses.length; h++) {
                        HouseID = getHouses[h].id;
                        PID = getHouses[h].pid;

                        const checkPlayer = await API.query("SELECT `id` FROM `arma_players` WHERE BINARY `Steam64id`=? AND (`Last Seen` < NOW() - INTERVAL 1 MONTH)",[PID]);
                        if (checkPlayer[0] !== undefined) {
                            await SQL.query("DELETE FROM `houses` WHERE `id`=?;",[HouseID]);
                        }

                        if (h + 1 == getHouses.length) {
                            Offset = Offset + setOffset;
                        }
                    }
                }

                if (i + 1 == loopTotal) {
                    return console.log('end');
                }
            }

        } else return;
    } catch (error) {
        console.log(error);
        return;
    }
}