const fastify = require('fastify');

class HttpServer {

    constructor(dataService){
        this.dataService = dataService;        
    }

    start(){
        this.fastifyServer = fastify({
            logger: true,
        });

        this.fastifyServer.register(require('fastify-cors'), { 
            origin: true,
        });

        this.fastifyServer.get('/data', async (_, reply)=>{
            try {
                const result = await this.dataService.query();
                reply.type('application/json', 200);
                return result;
            } catch (error) {
                console.error(`error while processing data with ${error}`);
                reply.type('application/json', 500);
                return `error`;
            }
        });
        this.fastifyServer.listen(8050, '0.0.0.0', (err, address)=>{
            if(err) throw err
            console.log(`listen on ${address}`)
        });
    }
    
}

module.exports = HttpServer;