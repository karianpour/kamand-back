import { config as readEnv } from 'dotenv';
readEnv();

import * as Debug from 'debug';
import { Server } from '../lib/index';

import { testQuery } from './query';

let server: Server;
let debug = Debug('kamand');

function main(){
  server = new Server();
  server.run();
  debug(`registering ${JSON.stringify(testQuery, null, 2)}`)
  server.registerQueryBuilder(testQuery);
}

debug(`starting...`);
main();