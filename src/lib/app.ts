import * as Debug from 'debug';
import { Server } from './server';
import { FastifyServerOptions, FastifyPluginOptions } from 'fastify';
import { ServerOptions as SocketIOServerOptions } from 'socket.io';

import { readdirSync, lstatSync } from 'fs';
import * as path from 'path';

const debug = Debug('kamand-app');

export class App{
  public server: Server;
  
  async init(
    rootPath: string,
    fastifyOptions: {
      fastify?: FastifyServerOptions,
      jwt?: FastifyPluginOptions,
      cors?: FastifyPluginOptions,
      fileUpload?: FastifyPluginOptions,
      swagger?: FastifyPluginOptions,
    } = {},
    socketOptions: SocketIOServerOptions = {},
  ){
    this.server = new Server();

    process.on('SIGINT', async () => {
      this.stop();
    });
    
    debug(`starting...`);

    await this.server.run(
      process.env.SERVER_HOST || '0.0.0.0',
      parseInt(process.env.SERVER_PORT || '8050'),
      process.env.WEBSOCKET_HOST || '0.0.0.0',
      parseInt(process.env.WEBSOCKET_PORT || '8040'),
      fastifyOptions,
      socketOptions,
    );

    const repositories = [];
    {
      const searchForRepositories = (normalizedPath: string) => {
        readdirSync(normalizedPath).forEach((file: string) => {
          const stat = lstatSync(path.join(normalizedPath, file));
          if(stat.isDirectory()){
            const normalizedPathR = path.join(normalizedPath, file);
            searchForRepositories(normalizedPathR);
          }
          if(stat.isFile() && file.match(/-(repository|report|listener).[jt]s$/)){
            const relativePath = path.relative(__dirname, path.join(normalizedPath, file));
            repositories.push((relativePath.startsWith('.') ? '' : './') + relativePath.substring(0, relativePath.length - 3));
          }
        });
      };
      const normalizedPath = path.join(rootPath, 'repositories');
      searchForRepositories(normalizedPath);
    }

    await Promise.all(repositories.map(async (file) => {
      debug(file);

      const repo = await import(file);
      if(repo.models){
        this.server.registerModel(repo.models);
      }
      if(repo.queries){
        this.server.registerQueryBuilder(repo.queries);
      }
      if(repo.listener){
        this.server.regsiterEventListener(repo.listener);
      }
    }));
    debug('repositories loaded');

  }

  async stop(){
    debug('stopping');
    try{
      await this.server.stop();
      process.exit(0);
    }catch(err){
      console.error(err);
      process.exit(1);
    }
  }

  listenNetwork(){
    this.server.listenNetwork();
  }
}