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
        API.query("INSERT INTO `rcon` (`Server`,`Category`,`Data`) VALUES(?,?,?);", [ServerName,'MSG',message], function (error, results, fields) {
            if (error) throw error;
            //console.log(results[0].insertid)
        });
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