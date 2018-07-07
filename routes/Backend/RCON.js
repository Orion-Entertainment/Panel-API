const BattleNode = require('battle-node');
const GETServers = require('./servers');
const API = require('../../core/app').API;

let Servers = [];

for (let i = 0; i < GETServers.length; i++) {
    connectRCon({
        ip: GETServers[i].IP,
        port: GETServers[i].RCONPort,
        rconPassword: GETServers[i].RCONPassword
    }, GETServers[i].Name)
}

async function connectRCon (BEConfig, ServerName) {
    const BE = new BattleNode(BEConfig);
    BE.login();
    BE.on('login', function(err, success) {
        if (err) {
            console.log('<RCON> Unable to Connect to '+ServerName+'.');
            Reconnect(BEConfig, ServerName);
        }
        else if (success == true) {
            API.query("DELETE FROM `rcon_players` WHERE `Server`=?;", [ServerName], function (error, results, fields) {
                if (error) throw error;
            });
            Servers.push({
                Name: ServerName,
                BE: BE
            });
            console.log('<RCON> Successfully logged into '+ServerName+'.');
        }
        else if (success == false) {
            console.log('<RCON> Login Failed to '+ServerName+'! (password may be incorrect)');
            Reconnect(BEConfig, ServerName);
        }
    });

    BE.on('disconnected', function() {
        API.query("DELETE FROM `rcon_players` WHERE `Server`=?;", [ServerName], function (error, results, fields) {
            if (error) throw error;
        });
        for (let i = 0; i < Servers.length; i++) {
            if (ServerName == Servers[i].Name) {
                Servers.splice(i, 1);
                Reconnect(BEConfig, ServerName);
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
        } else if (/\((Unknown|Vehicle|Direct)\) (.+): /g.test(message)) {
            Category = 'PlayerMSG';

            getData = /\((Unknown|Vehicle|Direct)\) (.+): (.+)/g.exec(message);
            getPlayer = await getPlayerGUID(ServerName, getData[1]);
            console.log(getPlayer)
            if (getPlayer !== false) {
                Data = JSON.stringify({
                    Channel: getData[1],
                    Name: getData[2],
                    GUID: getPlayer,
                    MSG: getData[3]
                });
            } else {
                Data = JSON.stringify({
                    Channel: getData[1],
                    Name: getData[2],
                    MSG: getData[3]
                });
            }
            
        } else if (/Player #\d+ (.+) (\((\d+.\d+.\d+.\d+):\d+\) connected|- BE GUID: (.+))|Verified GUID \((.+)\) of player #\d+ (.+)/g.test(message)) {
            Category = 'PlayerConnect';
            
            if (/Player #\d+ (.+) - BE GUID: (.+)/g.test(message)) {
                return;
            } else if (/Verified GUID \((.+)\) of player #\d+ (.+)/g.test(message)) {
                getData = /Verified GUID \((.+)\) of player #\d+ (.+)/g.exec(message);
                Data = JSON.stringify({
                    Name: getData[2],
                    GUID: getData[1]
                });
                addPlayer(ServerName, Data)
            } else if (/Player #\d+ (.+) \((\d+.\d+.\d+.\d+):\d+\) connected/g.test(message)) {
                getData = /Player #\d+ (.+) \((\d+.\d+.\d+.\d+):\d+\) connected/g.exec(message);
                Data = JSON.stringify({
                    Name: getData[1],
                    IP: getData[2]
                });
                addPlayer(ServerName, Data)
            }
        } else if (/Player #\d+ (.+) disconnected/g.test(message)) {
            Category = 'PlayerDisconnect';

            getData = /Player #\d+ (.+) disconnected/g.exec(message);
            getPlayer = await getPlayerGUID(ServerName, getData[1]);
            console.log(getPlayer)
            if (getPlayer !== false) {
                Data = JSON.stringify({
                    Name: getData[1],
                    GUID: getPlayer
                });
            } else {
                Data = JSON.stringify({
                    Name: getData[1]
                });
            }

            removePlayer(ServerName, getData[1]);
        } else if (/Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: /g.test(message)) {
            if (/Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: Admin Kick \((.+)\)/g.test(message)) {
                Category = 'PlayerKick';
                getData = /Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: Admin Kick \((.+)\)/g.exec(message);
                Data = JSON.stringify({
                    Name: getData[1],
                    GUID: getData[2],
                    MSG: getData[3]
                });

                removePlayer(ServerName, getData[1]);
            } else if (/Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: (.+)/g.test(message)) {
                Category = 'BEKick';
                getData = /Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: (.+)/g.exec(message);
                Data = JSON.stringify({
                    Name: getData[1],
                    GUID: getData[2],
                    MSG: getData[3]
                });

                removePlayer(ServerName, getData[1]);
            }
        } else {
            Category = 'Other';
            Data = message;
        }
        API.query("INSERT INTO `rcon` (`Server`,`Category`,`Data`) VALUES(?,?,?);", [ServerName,await Category,Data], function (error, results, fields) {
            if (error) throw error;
            //console.log(results[0].insertid)
            return;
        });
    });
}

async function addPlayer(ServerName, Data) {
    const data = JSON.parse(Data)
    if (data.IP === undefined) {
        API.query("INSERT INTO `rcon_players` (`Server`,`Name`,`GUID`) VALUES(?,?,?);", [ServerName,data.Name,data.GUID], function (error, results, fields) {
            if (error) throw error;
        });
    } else {
        API.query("INSERT INTO `rcon_players` (`Server`,`Name`,`IP`,`GUID`,`Ping`) VALUES(?,?,?,);", [ServerName,data.Name,data.IP], function (error, results, fields) {
            if (error) throw error;
        });
    }
}

async function removePlayer(ServerName, Name) {
    API.query("DELETE FROM `rcon_players` WHERE `Server`=? AND `Name`=?;", [ServerName,getData[1]], function (error, results, fields) {
        if (error) throw error;
    });
}

async function getPlayerGUID(ServerName, Name) {
    API.query("SELECT `GUID` FROM `rcon_players` WHERE `Server`=? AND `Name`=?;", [ServerName,Name], function (error, results, fields) {
        if (error) throw error;
        if (results[0] === undefined) {
            return false;
        } else {
            return results[0].GUID;
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
                    const ServerName = Servers[i].Name;
                    const BE = Servers[i].BE;
                    BE.sendCommand('players', async function(players) {
                        const getPlayers = /(\d+)\s+(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}:\d+\b)\s+(\d+)\s+([0-9a-fA-F]+)\(\w+\)\s([\S ]+)/g;
                        let Players = players.match(getPlayers);
                        if (Players !== null) {
                            for (let p = 0; p < Players.length; p++) {
                                const Name = Players[p].match(/(\(\w+\)\s?)([\S ]+)/g)[0].replace(/\(\?\)\s|(.*OK)\)\s/g, '').replace(/\s(\(Lobby\))/g, '');
                                const IP = Players[p].match(/(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})/g);
                                const GUID = Players[p].match(/([0-9a-fA-F]+)(\(\w+\))/g)[0].replace(/(\(\?\)|\(\w+\))/g, '');
                                const Ping = Players[p].match(/(?<=:\d+\b\s*)(\d+)/g);

                                API.query("SELECT `IP`,`GUID` FROM `rcon_players` WHERE `Server`=? AND `Name`=? AND `IP`=? AND `GUID`=?;", [ServerName,Name,IP,GUID], function (error, results, fields) {
                                    if (error) throw error;
                                    if (results[0] === undefined) {
                                        API.query("INSERT INTO `rcon_players` (`Server`,`Name`,`IP`,`GUID`,`Ping`) VALUES(?,?,?,?,?);", [ServerName,Name,IP,GUID,Ping], function (error, results, fields) {
                                            if (error) throw error;
                                        });
                                    } else {
                                        if (results[0].IP === undefined) {
                                            API.query("UPDATE `rcon_players` set `IP`=?,`Ping`=? WHERE `Server`=? AND `Name`=? AND `GUID`=?;", [IP,Ping,ServerName,Name,GUID], function (error, results, fields) {
                                                if (error) throw error;
                                            });
                                        } else if (results[0].GUID === undefined) {
                                            API.query("UPDATE `rcon_players` set `GUID`=?,`Ping`=? WHERE `Server`=? AND `Name`=? AND `IP`=?;", [GUID,Ping,ServerName,Name,IP], function (error, results, fields) {
                                                if (error) throw error;
                                            });
                                        } else {
                                            API.query("UPDATE `rcon_players` set `Ping`=? WHERE `Server`=? AND `Name`=? AND `IP`=? AND `GUID`=?;", [Ping,ServerName,Name,IP,GUID], function (error, results, fields) {
                                                if (error) throw error;
                                            });
                                        }
                                    }
                                });

                                
                                /*
                                if (p + 1 == Players.length) {
                                    //savePlayers

                                }*/
                            }
                        }
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
checkPlayers(10); //Time in seconds


async function Reconnect(BEConfig, ServerName) {
    setTimeout(() => {
        if (Servers.length < 1) {
            connectRCon(BEConfig, ServerName)
        } else {
            for (let i = 0; i < Servers.length; i++) {
                if (Servers[i].Name == ServerName) {
                    return;
                } else if (i + 1 == Servers.length) {
                    connectRCon(BEConfig, ServerName)
                }
            }
        }
    }, 10000);
}

module.exports = Servers;