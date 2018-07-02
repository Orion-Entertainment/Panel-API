//Name
Name = 'Panel-API';
//HTTP Port
Port = '3333';

const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

const app = require('./core/app');
const http = require('http');
const debug = require('debug')('demo:server');
process.env.TZ = 'America/Montreal';
if (cluster.isMaster) {
    //console.log(Name+`: Master ${process.pid} is running`);

    for (let i = 0; i < numCPUs; i++) {
        cluster.fork();
    }

    cluster.on('exit', (worker, code, signal) => {
        //console.log(`API: Worker ${worker.process.pid} died`);
    });
  
    /* BACKGROUND TASKS */
    //require('./routes/BackgroundTasks/index');
} else {
    
    const port = normalizePort(process.env.PORT || Port);
    app.set('port', port);
    
    app.use(function (req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', 'http://127.0.0.1');
        res.setHeader('Access-Control-Allow-Methods', 'POST');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        res.setHeader('Access-Control-Allow-Credentials', true);
        next();
    });
    
    const server = http.createServer(app).listen(port);
    server.on('error', onError);
    server.on('listening', onListening);
    //console.log(Name+": Starting on Port: "+port);
    
    function normalizePort(val) {
        const port = parseInt(val, 10);
        if (isNaN(port)) {
            return val;
        }
        if (port >= 0) {
            return port;
        }
        return false;
    }
    
    function onError(error) {
        if (error.syscall !== 'listen') {
            throw error;
        }
        const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`;
        switch (error.code) {
            case 'EACCES':
                //console.error(Name+`: ${bind} requires elevated privileges`);
                process.exit(1);
                break;
            case 'EADDRINUSE':
                //console.error(Name+`: ${bind} is already in use`);
                process.exit(1);
                break;
            default:
                throw error;
        }
    }
    
    function onListening() {
        const addr = server.address();
        const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`;
        //debug(Name+`: Listening on ${bind}`);
    }

    //console.log(Name+`: Worker ${process.pid} started`);
}