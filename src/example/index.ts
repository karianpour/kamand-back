import { config as readEnv } from 'dotenv';
readEnv();

import * as Debug from 'debug';
import { Server } from '../lib/index';

import { queries } from './query';
import models from './model';

let server: Server;
let debug = Debug('kamand');

async function main(){
  server = new Server();
  await server.run();
  server.registerQueryBuilder(queries);
  server.registerModel(models);
}

debug(`starting...`);
main();