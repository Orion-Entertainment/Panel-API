const BattleNode = require('battle-node');
const GETServers = require('./servers');

console.log(`RCON.js LENGTH: `, GETServers.length)

let Servers = [];
for (let i = 0; i < GETServers.length; i++) {
    const ServerName = GETServers[i].Name;
    const BE = new BattleNode({
        ip: GETServers[i].IP,
        port: GETServers[i].RCONPort,
        rconPassword: GETServers[i].RCONPassword
    });
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
            }
        }
        //console.log('RCON server disconnected.');
    });
}

module.exports = Servers;