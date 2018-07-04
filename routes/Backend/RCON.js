const BattleNode = require('battle-node');
const GETServers = require('./servers');
const API = require('../../core/app').API;

let Servers = [];
for (let i = 0; i < GETServers.length; i++) {
    const ServerName = GETServers[i].Name;
    const BEConfig = {
        ip: GETServers[i].IP,
        port: GETServers[i].RCONPort,
        rconPassword: GETServers[i].RCONPassword
    };
    const BE = new BattleNode(BEConfig);
    BE.login();
    BE.on('login', function(err, success) {
        if (err) {
            console.log('<RCON> Unable to Connect to '+ServerName+'.');
        }

        if (success == true) {
            Servers.push({
                Name: ServerName,
                BE: BE
            });
            console.log('<RCON> Successfully logged into '+ServerName+'.');
        }
        else if (success == false) {
            console.log('<RCON> Login Failed to '+ServerName+'! (password may be incorrect)');
        }
    });

    BE.on('disconnected', function() {
        for (let i = 0; i < Servers.length; i++) {
            if (ServerName == Servers[i].Name) {
                Servers.splice(i, 1);
                Reconnect(BEConfig);
            }
        }
    });

    BE.on('message', async function(message) {
        if (/RCon admin #\d: \(Global\)/g.test(message)) {
            Category = 'ServerMSG';

            getData = /RCon admin #\d: \(Global\) (.+)/g.exec(message);
            Data = JSON.stringify({
                MSG: getData[1]
            });
        } else if (/RCon admin #\d+ \((\d+.\d+.\d+.\d+:\d+)\) logged in/g.test(message)) {
            Category = 'RConConnect';

            getData = /RCon admin #\d+ \((\d+.\d+.\d+.\d+:\d+)\) logged in/g.exec(message);
            Data = JSON.stringify({
                IP: getData[1]
            });
        } else if (/\((Unknown|Vehicle|Direct)\) .+: /g.test(message)) {
            Category = 'PlayerMSG';

            getData = /\((Unknown|Vehicle|Direct)\) .+: (.+)/g.exec(message);
            Data = JSON.stringify({
                Channel: getData[1],
                MSG: getData[2]
            });
        } else if (/Player #\d+ (.+) (\((\d+.\d+.\d+.\d+):\d+\) connected|- BE GUID: (.+))|Verified GUID \((.+)\) of player #\d+ (.+)/g.test(message)) {
            Category = 'PlayerConnect';
            if (/Player #\d+ (.+) - BE GUID: (.+)/g.test(message)) {
                Return = false;
            } else if (/Verified GUID \((.+)\) of player #\d+ (.+)/g.test(message)) {
                getData = /Verified GUID \((.+)\) of player #\d+ (.+)/g.exec(message);
                Data = JSON.stringify({
                    Name: getData[2],
                    GUID: getData[1]
                });
            } else if (/Player #\d+ (.+) \((\d+.\d+.\d+.\d+):\d+\) connected/g.test(message)) {
                getData = /Player #\d+ (.+) \((\d+.\d+.\d+.\d+):\d+\) connected/g.exec(message);
                Data = JSON.stringify({
                    Name: getData[1],
                    IP: getData[2]
                });
            }
        } else if (/Player #\d+ (.+) disconnected/g.test(message)) {
            Category = 'PlayerDisconnect';

            getData = /Player #\d+ (.+) disconnected/g.exec(message);
            Data = JSON.stringify({
                Name: getData[1]
            });
        } else if (/Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: Admin Kick \((.+)\)/g.test(message)) {
            Category = 'PlayerKick';

            getData = /Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: Admin Kick \((.+)\)/g.exec(message);
            Data = JSON.stringify({
                Name: getData[1],
                MSG: getData[2]
            });
        } else {
            Category = 'Other';
            Data = message;
        }
        
        if (Return !== false) {
            API.query("INSERT INTO `rcon` (`Server`,`Category`,`Data`) VALUES(?,?,?);", [ServerName,await Category,Data], function (error, results, fields) {
                if (error) throw error;
                //console.log(results[0].insertid)
            });
        }
    });
}

let checkingPlayers = false;
async function checkPlayers(time) {
    setTimeout(function() {
        if (checkingPlayers != true) {
            checkingPlayers = true;
            if (Servers.length > 0) {
                for (let i = 0; i < Servers.length; i++) {
                    const BE = Servers[i].BE;
                    BE.sendCommand('players', async function(players) {
                        let savePlayers = [];
                        const getPlayers = /(\d+)\s+(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+\b)\s+(\d+)\s+([0-9a-fA-F]+)\(\w+\)\s([\S ]+)/g;
                        let Players = players.match(getPlayers);
                        if (Players !== null) {
                            for (let p = 0; p < Players.length; p++) {
                                const Name = Players[p].match(/(\(\w+\)\s?)([\S ]+)/g)[0].replace(/\(\?\)\s|(.*OK)\)\s/g, '').replace(/\s(\(Lobby\))/g, '');
                                const IP = Players[p].match(/(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g);
                                const GUID = Players[p].match(/([0-9a-fA-F]+)(\(\w+\))/g)[0].replace(/(\(\?\)|\(\w+\))/g, '');
                                const Ping = Players[p].match(/(?<=:\d+\b\s*)(\d+)/g);
                                await savePlayers.push(Name, GUID, IP, Ping);
    
                                if (p + 1 == Players.length) {
                                    //savePlayers
                                }
                            }
                        }
                        //console.log(players);
                    });
    
                    if (i + 1 == Servers.length) {
                        checkingPlayers = false;
                    }
                }
            }
        } else {
            return;
        }
    checkPlayers(time);
    }, time * 1000);
}
//checkPlayers(5); //Time in seconds


async function Reconnect(BEConfig) {
    //Attempt to reconnect for 10 minutes if false console.log msg
}

module.exports = Servers;