import { config as readEnv } from 'dotenv';
readEnv();

import * as Debug from 'debug';
import { Server } from '../lib/index';

import { queries } from './query';
import models from './model';

let server: Server;
let debug = Debug('kamand-example');

async function main(){
  server = new Server();
  await server.run();
  server.registerQueryBuilder(queries);
  server.registerModel(models);
}

process.on('SIGINT', async function() {
  debug('stopping');
  try{
    await server.stop();
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
});

debug(`starting...`);
main();