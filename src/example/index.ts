import { config as readEnv } from 'dotenv';
readEnv();

import * as Debug from 'debug';
import { Server } from '../lib/index';

import { queries } from './query';

let server: Server;
let debug = Debug('kamand');

function main(){
  server = new Server();
  server.run();
  server.registerQueryBuilder(queries);
}

debug(`starting...`);
main();