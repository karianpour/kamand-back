import { config as readEnv } from 'dotenv';
readEnv();

import * as Debug from 'debug';
import { Server } from '../lib/index';

// import { queries } from './query';
// import models from './model';
import { models as authModels } from './auth-repository';
import { queries as accQueries, models as accModels } from './acc-repository';
import { queries as voucherQueries, models as voucherModels } from './voucher-repository';
import { models as fileModels } from './file-repository';
import { listener as jobEvent } from './job-repository';
import { listener as longTaskEvent } from './long-task-repository';

let server: Server;
let debug = Debug('kamand-example');

export async function app({noNetwork}:{noNetwork?: boolean}){
  server = new Server();

  await server.run(
    process.env.SERVER_HOST || '0.0.0.0',
    parseInt(process.env.SERVER_PORT || '8050'),
    false,
    true,
    process.env.WEBSOCKET_HOST || '0.0.0.0',
    parseInt(process.env.WEBSOCKET_PORT || '8040'),
    noNetwork
  );

  // server.registerQueryBuilder(queries);
  // server.registerModel(models);

  server.registerModel(authModels);

  server.registerQueryBuilder(accQueries);
  server.registerModel(accModels);

  server.registerQueryBuilder(voucherQueries);
  server.registerModel(voucherModels);

  server.registerModel(fileModels);

  server.regsiterEventListener(jobEvent);
  server.regsiterEventListener(longTaskEvent);
  return server;
}

