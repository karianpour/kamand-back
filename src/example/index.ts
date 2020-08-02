import { config as readEnv } from 'dotenv';
readEnv();

import {App} from '../lib/app';

async function main (){
  const app = new App();
  await app.init(__dirname);
  app.listenNetwork();
}

main();