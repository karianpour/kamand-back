import { config as readEnv } from 'dotenv';
const testEnv = process.argv.findIndex( a => a === '--test') !== -1;
testEnv && (process.env.testEnv = 'true');
readEnv({
  path: testEnv ? '.env.test' : '.env',
});

import {App} from '../lib/app';

async function main (){
  const app = new App();
  await app.init(__dirname, {
    fastify: {
      logger: true,
    }
  });
  app.listenNetwork();
}

main();