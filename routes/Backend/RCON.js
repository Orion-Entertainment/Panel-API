const BattleNode = require('battle-node');
const GETServers = require('../../core/app').Servers;
const API = require('../../core/app').API;
const moment = require('moment');

const ServerMSGs = [
    "Help keep the server running by supporting us at https://orionlife.enjin.com/shop",
    "Check out our website: Orion-Entertainment.net",
    "Our Teamspeak IP: ts.Orion-Entertainment.net",

    "Server Restart in 1 Minute!",
    "Server Restart in 2 Minutes!",
    "Server Restart in 3 Minutes!",
    "Server Restart in 4 Minutes!",
    "Server Restart in 5 Minutes!",
    "Server Restart in 10 Minutes!",
    "Server Restart in 30 Minutes!",
    "Server Restart in 1 Hour!",
    "Server Restart in 2 Hours!"
];

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
            //console.log('<RCON> Unable to Connect to '+ServerName+'.');
            Reconnect(BEConfig, ServerName);
        }
        else if (success == true) {
            API.query("DELETE FROM `arma_liveplayers` WHERE BINARY `Server`=?;", [ServerName], function (error, results, fields) {
                if (error) throw error;
            });
            Servers.push({
                Name: ServerName,
                BE: BE
            });
            //console.log('<RCON> Successfully logged into '+ServerName+'.');
        }
        else if (success == false) {
            console.log('<RCON> Login Failed to '+ServerName+'! (password may be incorrect)');
            Reconnect(BEConfig, ServerName);
        }
    });

    BE.on('disconnected', function() {
        API.query("DELETE FROM `arma_liveplayers` WHERE BINARY `Server`=?;", [ServerName], function (error, results, fields) {
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
            getData = /RCon admin #\d: \(Global\) (.+)/g.exec(message);
            if (ServerMSGs.includes(getData[1])) return;

            //Save to DB
            API.query("INSERT INTO `arma_chat` (`Server`,`Channel`,`MSG`) VALUES(?,?,?);", [ServerName,"RCONAdmin",getData[1]], function (error, results, fields) {
                if (error) throw error;
                return;
            });
        } else if (/RCon admin #\d+ \((\d+.\d+.\d+.\d+:\d+)\) logged in/g.test(message)) {
            getData = /RCon admin #\d+ \((\d+.\d+.\d+.\d+:\d+)\) logged in/g.exec(message);

            //Save to DB
            API.query("INSERT INTO `arma_chat` (`Server`,`Channel`,`MSG`) VALUES(?,?,?);", [ServerName,"RCONConnect",getData[1]], function (error, results, fields) {
                if (error) throw error;
                return;
            });
        } else if (/\((Unknown|Vehicle|Direct|Group)\) (.+): /g.test(message)) {
            getData = /\((Unknown|Vehicle|Direct|Group)\) (.+): (.+)/g.exec(message);
            getPlayer = await getPlayerGUID(ServerName, getData[2]);
            if (getPlayer !== undefined && getPlayer !== null) {
                if (getData[3] == null) return;
                //Save to DB
                API.query("INSERT INTO `arma_chat` (`Server`,`Channel`,`Name`,`GUID`,`MSG`) VALUES(?,?,?,?,?);", [ServerName,getData[1],getData[2],getPlayer.GUID,getData[3]], function (error, results, fields) {
                    if (error) throw error;
                    return;
                });
            } else {
                //Save to DB
                API.query("INSERT INTO `arma_chat` (`Server`,`Channel`,`Name`,`MSG`) VALUES(?,?,?,?);", [ServerName,getData[1],getData[2],getData[3]], function (error, results, fields) {
                    if (error) throw error;
                    return;
                });
            }

        } else if (/Player #\d+ (.+) (\((\d+.\d+.\d+.\d+):\d+\) connected|- BE GUID: (.+))|Verified GUID \((.+)\) of player #\d+ (.+)/g.test(message)) {
            if (/Player #\d+ (.+) - BE GUID: (.+)/g.test(message)) {
                return;
            } else if (/Verified GUID \((.+)\) of player #\d+ (.+)/g.test(message)) {
                getData = /Verified GUID \((.+)\) of player #\d+ (.+)/g.exec(message);
                addPlayer(ServerName, getData[2], getData[1])

                //Save to DB
                API.query("UPDATE `arma_connect` set `GUID`=? WHERE BINARY `Name`=? ORDER BY `Time` DESC LIMIT 1;", [getData[1],getData[2]], function (error, results, fields) {
                    if (error) throw error;
                    return;
                });
            } else if (/Player #\d+ (.+) \((\d+.\d+.\d+.\d+):\d+\) connected/g.test(message)) {
                getData = /Player #\d+ (.+) \((\d+.\d+.\d+.\d+):\d+\) connected/g.exec(message);

                //Save to DB
                API.query("INSERT INTO `arma_connect` (`Server`,`Option`,`Name`,`IP`) VALUES(?,?,?,?);", [ServerName,"Connect",getData[1],getData[2]], function (error, results, fields) {
                    if (error) throw error;
                    return;
                });
            }
        } else if (/Player #\d+ (.+) disconnected/g.test(message)) {
            getData = /Player #\d+ (.+) disconnected/g.exec(message);
            getPlayer = await getPlayerGUID(ServerName, getData[1]);
            if (getPlayer !== undefined && getPlayer !== null) {
                //Save to DB
                API.query("INSERT INTO `arma_connect` (`Server`,`Option`,`Name`,`GUID`) VALUES(?,?,?,?);", [ServerName,"Disconnect",getData[1],getPlayer.GUID], function (error, results, fields) {
                    if (error) throw error;
                    return;
                });
            } else {
                //Save to DB
                API.query("INSERT INTO `arma_connect` (`Server`,`Option`,`Name`) VALUES(?,?,?);", [ServerName,"Disconnect",getData[1]], function (error, results, fields) {
                    if (error) throw error;
                    return;
                });
            }

            removePlayer(ServerName, getData[1]);
        } else if (/Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: /g.test(message)) {
            if (/Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: Admin Kick \((.+)\)/g.test(message)) {
                getData = /Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: Admin Kick \((.+)\)/g.exec(message);
                removePlayer(ServerName, getData[1]);
                if (getData[2] == "" | getData[2] == "-") {
                    guid = null;
                } else {
                    guid = getData[2];
                }

                //Save kick
                API.query("INSERT INTO `arma_kick` (`Server`,`By`,`Name`,`GUID`,`Reason`) VALUES(?,?,?,?,?);", [ServerName,"Admin",getData[1],guid,getData[3]], function (error, results, fields) {
                    if (error) throw error;
                    return;
                });
            } else if (/Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: (.+)/g.test(message)) {
                getData = /Player #\d+ (.+) \((.+)\) has been kicked by BattlEye: (.+)/g.exec(message);
                removePlayer(ServerName, getData[1]);

                if (/.+ Restriction #\d+/.test(getData[3])) {
                    //Add ban for hacking
                    banPlayer(getData[2],1,getData[3],"+Flabby - Perm - Hacking")
                }

                //Save kick
                API.query("INSERT INTO `arma_kick` (`Server`,`By`,`Name`,`GUID`,`Reason`) VALUES(?,?,?,?,?);", [ServerName,"Battleye",getData[1],getData[2],getData[3]], function (error, results, fields) {
                    if (error) throw error;
                    return;
                });
            }
        } else {
            /* Shouldn't need this but .-. */
            console.log(message)
        }
    });
}

async function addPlayer(ServerName, Name, GUID) {
    API.query("INSERT INTO `arma_liveplayers` (`Server`,`Name`,`GUID`) VALUES(?,?,?);", [ServerName,Name,GUID], async function (error, results, fields) {
        if (error) throw error;
        else {
            await API.query("UPDATE `arma_players` SET `Last Seen`=? WHERE `GUID`=?;", [await moment(new Date()).format('YYYY/MM/DD HH:mm:ss'),GUID]);
        }
    });
}

async function removePlayer(ServerName, Name) {
    API.query("DELETE FROM `arma_liveplayers` WHERE BINARY `Server`=? AND BINARY `Name`=?;", [ServerName,Name], function (error, results, fields) {
        if (error) throw error;
    });
}

async function getPlayerGUID(ServerName, Name) {
    const query = await API.query("SELECT `GUID` FROM `arma_liveplayers` WHERE BINARY `Server`=? AND BINARY `Name`=?;", [ServerName,Name]);
    return query[0];
}

async function checkForBan(ServerName, GUID) {
    const query = await API.query("SELECT `id`,`Server`,`Reason`,`Expires` FROM `arma_bans` WHERE BINARY `GUID`=? AND `Expired`='False';", [GUID]);
    if (query[0] == undefined) return false;
    else if (query[0] == null) return false;
    else if (query[0].Server !== ServerName && query[0].Server !== null) return false;
    else if (query[0].Expires !== null) {
        const Now = await moment(new Date());
        const Expires = await moment(query[0].Expires);
        const diff = await Now.diff(Expires);

        if (diff > 0) {
            await API.query("UPDATE `arma_bans` set `Expired`='true' WHERE `id`=?;", [query[0].id]);
            return false;
        } else return kickPlayer(ServerName, GUID, query[0].Reason);
    } else return kickPlayer(ServerName, GUID, query[0].Reason);
}

async function kickPlayer(ServerName, GUID, Reason) {
    for (let i = 0; i < Servers.length; i++) {
        if (ServerName == Servers[i].Name) {
            const BE = Servers[i].BE;
            const KickID = await API.query("SELECT `ID` FROM `arma_liveplayers` WHERE BINARY `Server`=? AND BINARY `GUID`=?;", [ServerName,GUID]);
            if (KickID[0] == undefined) return true;
            if (KickID[0].ID == null) return true;
            const SendCommand = 'kick '+KickID[0].ID +' '+Reason;
            BE.sendCommand(SendCommand);
            return true;
        } else if (i + 1 == Servers.length) return false;
    }
}

async function banPlayer(GUID, BannedBy, Notes, Reason) {
    API.query("INSERT INTO `arma_bans` (`GUID`,`BannedBy`,`Notes`,`Reason`) VALUES(?,?,?,?);", [GUID,BannedBy,Notes,Reason], function (error, results, fields) {
        if (error) throw error;
    });
    return true;
}

async function updatePlayer(Name, IP, GUID) {
    const query = await API.query("SELECT `Last Name`,`Names`,`Last IP`,`IPs` FROM `arma_players` WHERE BINARY `GUID`=?;", [GUID]);
    const Now = await moment(new Date()).format('YYYY/MM/DD HH:mm:ss');
    if (query[0] == undefined) {
        const Names = JSON.stringify([{
            Name: Name,
            Time: Now
        }]);
        const IPs = JSON.stringify([{
            IP: IP,
            Time: Now
        }]);

        API.query("INSERT INTO `arma_players` (`Last Name`,`Names`,`Last IP`,`IPs`,`GUID`,`First Seen`) VALUES(?,?,?,?,?,?);", [Name,Names,IP,IPs,GUID,Now], function (error, results, fields) {
            if (error) {
                if (error = "ER_DUP_ENTRY") {
                    return;
                } else {
                    throw error
                }
            };
            return;
        });
    } else {
        const Player = query[0];

        if (Player["Last Name"] !== Name) {
            let Names = [];
            if (Player["Names"] !== null) {
                Names = await JSON.parse(Player["Names"]);
            } else {
                Names = [];
            }

            //Check if name is in array if not push new one
            if (Names.length > 0) {
                for (let i = 0; i < Names.length; i++) {
                    if (Names[i].Name == Name) {
                        Names.splice(i,1);
                        Names.push({
                            Name: Name,
                            Time: Now
                        });
                    } else if (i + 1 == Names.length) {
                        Names.push({
                            Name: Name,
                            Time: Now
                        });
                    }
                }
            } else {
                Names.push({
                    Name: Name,
                    Time: Now
                });
            }

            if (Names.length > 20) { //Max to save = 20
                await Names.splice(0,1);
            }
            await API.query("UPDATE `arma_players` set `Last Name`=?,`Names`=? WHERE BINARY `GUID`=?;", [Name,JSON.stringify(Names),GUID]);
        }

        if (Player["Last IP"] !== IP) {
            let IPs = [];
            if (Player["IPs"] !== null) {
                IPs = JSON.parse(Player["IPs"]);
            } else {
                IPs = [];
            }

            if (IPs.length > 0) {
                for (let i = 0; i < IPs.length; i++) {
                    if (IPs[i].IP == IP) {
                        IPs.splice(i,1);
                        IPs.push({
                            IP: IP,
                            Time: Now
                        });
                    } else if (i + 1 == IPs.length) {
                        IPs.push({
                            IP: IP,
                            Time: Now
                        });
                    }
                }
            } else {
                IPs.push({
                    IP: IP,
                    Time: Now
                });
            }

            if (IPs.length > 20) { //Max to save = 20
                IPs.splice(0,1);
            }
            await API.query("UPDATE `arma_players` set `Last IP`=?,`IPs`=? WHERE BINARY `GUID`=?;", [IP,JSON.stringify(IPs),GUID]);
        }

        return;
    }
}

let checkingPlayers = false;
async function checkPlayers(time) {
    try {
        setTimeout(function() {
            if (checkingPlayers == false) {
                if (Servers.length > 0) {
                    checkingPlayers = true;
                    for (let i = 0; i < Servers.length; i++) {
                        const ServerName = Servers[i].Name;
                        const BE = Servers[i].BE;
                        BE.sendCommand('players', async function(players) {
                            const GetPlayers = players;
                            const First = await GetPlayers.replace(/Players on server:|\[#\] \[IP Address\]:\[Port\] \[Ping\] \[GUID\] \[Name\]/g, '');
                            if (First == null) return;
                            const Players = First.match(/(\d+)\s+(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+\b\s+(\d+)\s+([0-9a-fA-F]+)\(\w+\)\s([\S ]+)/g);
                            if (Players == null) return;
                            for (let p = 0; p < Players.length; p++) {
                                const getInfo = Players[p].match(/(\d+)\s+(\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):\d+\b\s+(\d+)\s+([0-9a-fA-F]+)\(\w+\)\s([\S ]+)/)

                                const Name = getInfo[5].replace(/\s(\(Lobby\))/, '');
                                const IP = getInfo[2];
                                const GUID = getInfo[4];
                                const Ping = getInfo[3];
                                const ID = getInfo[1];

                                if (Name !== null && IP !== null && GUID !== null && Ping !== null && ID !== null) {
                                    API.query("SELECT `IP`,`GUID`,`Ping`,`ID` FROM `arma_liveplayers` WHERE BINARY `Server`=? AND BINARY `GUID`=?;", [ServerName,GUID], async function (error, results, fields) {
                                        if (error) throw error;
                                        else if (results[0] == undefined) {
                                            API.query("INSERT INTO `arma_liveplayers` (`Server`,`Name`,`IP`,`GUID`,`ID`,`Ping`) VALUES(?,?,?,?,?,?);", [ServerName,Name,IP,GUID,ID,Ping], function (error, results, fields) {
                                                if (error) throw error;
                                                return;
                                            });
                                        } else {
                                            if (results[0].IP == null | results[0].IP == "") {
                                                API.query("UPDATE `arma_liveplayers` set `IP`=?,`Ping`=? WHERE BINARY `Server`=? AND BINARY `Name`=? AND BINARY `GUID`=?;", [IP,Ping,ServerName,Name,GUID], function (error, results, fields) {
                                                    if (error) throw error;
                                                    return;
                                                });
                                            } else if (results[0].GUID == null | results[0].GUID == "") {
                                                API.query("UPDATE `arma_liveplayers` set `GUID`=?,`Ping`=? WHERE BINARY `Server`=? AND BINARY `Name`=? AND BINARY `IP`=?;", [GUID,Ping,ServerName,Name,IP], function (error, results, fields) {
                                                    if (error) throw error;
                                                    return;
                                                });
                                            } else if (results[0].ID == null | results[0].ID == "") {
                                                API.query("UPDATE `arma_liveplayers` set `ID`=?,`Ping`=? WHERE BINARY `Server`=? AND BINARY `GUID`=?;", [ID,Ping,ServerName,GUID], function (error, results, fields) {
                                                    if (error) throw error;
                                                    return;
                                                });
                                            } else if (Ping !== results[0].Ping) {
                                                updatePlayer(Name, results[0].IP, results[0].GUID);
                                                API.query("UPDATE `arma_liveplayers` set `Ping`=? WHERE BINARY `Server`=? AND BINARY `GUID`=?;", [Ping,ServerName,GUID], function (error, results, fields) {
                                                    if (error) throw error;
                                                    return;
                                                });
                                            }

                                            //Check if banned
                                            checkForBan(ServerName, GUID);
                                            return;
                                        }
                                    });
                                } else return;
                            }
                        });

                        if (i + 1 == Servers.length) {
                            checkingPlayers = false;
                        }
                    }
                }
            }
            checkPlayers(time);
        }, time * 1000);
    } catch (error) {
        console.error(error)
        setTimeout(function() {
            checkingPlayers = false;
            checkPlayers(time);
        }, time * 1000);
    }
}
checkPlayers(1); //Time in seconds


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
module.exports.Rcon = {
    "Kick": function(ServerName, GUID, Reason) {
        return kickPlayer(ServerName, GUID, Reason);
    },
    "Ban": function(GUID, BannedBy, Notes, Reason) {
        return banPlayer(GUID, BannedBy, Notes, Reason);
    }
};