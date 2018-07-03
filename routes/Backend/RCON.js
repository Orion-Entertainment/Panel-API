const BattleNode = require('battle-node');
const GETServers = require('./servers');

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
}

async function Reconnect(BEConfig) {
    //Attempt to reconnect for 10 minutes if false console.log msg
}

module.exports = Servers;