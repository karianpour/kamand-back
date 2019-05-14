import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as fastifyCors from 'fastify-cors';
import { DataService } from './data-service';
import * as Debug from 'debug';

let debug = Debug('kamand');

export class HttpServer {

  private fastifyServer:fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;

  constructor(
    private dataService: DataService
  ){
  }

  start(){
    this.fastifyServer = fastify({
      logger: true,
    });

    this.fastifyServer.register(fastifyCors, { 
      origin: true,
    });

    this.fastifyServer.get<fastify.DefaultQuery, {queryData: string}, unknown>('/data/:queryData', async (req, reply)=>{
      const query = req.params.queryData;
      const queryParams = req.query;
      try {
        const result = await this.dataService.query(query, queryParams);
        reply.type('application/json').code(200);
        return result;
      } catch (error) {
        console.error(`error while processing data with query : ${query}\n params: ${JSON.stringify(queryParams, null, 2)}\n${error}`);
        reply.type('application/json').code(500);
        return `error`;
      }
    });
    this.fastifyServer.listen(8050, '0.0.0.0', (err, address)=>{
      if(err) throw err;
      debug(`listen on ${address}`);
    });
  }
}