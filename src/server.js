const HttpServer = require('./http-server');
const DataService = require('./data-service');

class Server {

    async run(){
        this.dataService = new DataService();
        await this.dataService.connect();

        this.httpServer = new HttpServer(this.dataService);
        this.httpServer.start();
    }
}

module.exports = Server;