import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import * as fastifyCors from 'fastify-cors';
import * as fastifyJwt from 'fastify-jwt';
import { DataService } from './data-service';
import { InternalServerError } from 'http-errors';
import * as Debug from 'debug';
import { Model } from './interfaces';
import { SignOptions } from 'jsonwebtoken';

let debug = Debug('kamand');

export class HttpServer {

  private fastifyServer:fastify.FastifyInstance<Server, IncomingMessage, ServerResponse>;

  constructor(
    private dataService: DataService,
    private host: string = '0.0.0.0',
    private port: number = 8050,
  ){
  }

  start(){
    this.fastifyServer = fastify({
      logger: true,
    });

    this.fastifyServer.register(fastifyCors, { 
      origin: true,
    });

    this.fastifyServer.register(fastifyJwt, {
      secret: process.env.JWT_SECRET_KEY,
    });

    this.fastifyServer.decorate("authenticate", async function(request, reply) {
      try {
        await request.jwtVerify()
      } catch (err) {
        reply.send(err)
      }
    })  

    this.fastifyServer.get<fastify.DefaultQuery, {queryData: string}, unknown>(
      '/data/:queryData',
      {
      },
      async (req, reply)=>{
        const query = req.params.queryData;
        const queryParams = req.query;
        try {
          const result = await this.dataService.query(query, queryParams);
          reply.type('application/json').code(200);
          return result;
        } catch (error) {
          if(error.statusCode){
            reply.send(error);
          }else{
            console.error(`error while processing data with query : ${query}\n params: ${JSON.stringify(queryParams, null, 2)}\n${error}`);
            reply.send(new InternalServerError());
          }
        }
      }
    );

    this.fastifyServer.get<fastify.DefaultQuery, {queryData: string}, unknown>(
      '/private/data/:queryData',
      {
        preValidation: [this.fastifyServer.authenticate]
      },
      async (req, reply)=>{
        const query = req.params.queryData;
        const queryParams = req.query;
        try {
          const result = await this.dataService.query(query, queryParams, req.user);
          reply.type('application/json').code(200);
          return result;
        } catch (error) {
          if(error.statusCode){
            reply.send(error);
          }else{
            console.error(`error while processing private/data with query : ${query}\n params: ${JSON.stringify(queryParams, null, 2)}\n${error}`);
            reply.send(new InternalServerError());
          }
        }
      }
    );

    this.fastifyServer.post('/auth/login', (req, reply) => {
      const payload = { aid:'12345' }
      const token = this.fastifyServer.jwt.sign({ payload })
      reply.send({ token })
    })
    
    this.fastifyServer.listen(this.port, this.host, (err, address)=>{
      if(err) throw err;
      debug(`listen on ${address}`);
    });
  }

  sign(payload: fastify.JWTTypes.SignPayloadType, options?: SignOptions): string{
    return this.fastifyServer.jwt.sign(payload, options);
  }

  registerModelRoutes(models: Model[]){//routes: fastify.RouteOptions<Server, IncomingMessage, ServerResponse, fastify.DefaultQuery, fastify.DefaultParams, fastify.DefaultHeaders, any>[]){
    models.map(m => {
      const address = m.address();
      const routes = m.routes();
      routes.forEach( route => {
        route.url = address + route.url;
        this.fastifyServer.route(route);
      });
    });
  }
}