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

let debug = Debug('kamand-example');

export class App{
  public server: Server;
  
  async init(){
    this.server = new Server();

    process.on('SIGINT', async () => {
      this.stop();
    });
    
    debug(`starting...`);

    await this.server.run(
      process.env.SERVER_HOST || '0.0.0.0',
      parseInt(process.env.SERVER_PORT || '8050'),
      false,
      true,
      process.env.WEBSOCKET_HOST || '0.0.0.0',
      parseInt(process.env.WEBSOCKET_PORT || '8040'),
    );

    // this.server.registerQueryBuilder(queries);
    // this.server.registerModel(models);

    this.server.registerModel(authModels);

    this.server.registerQueryBuilder(accQueries);
    this.server.registerModel(accModels);

    this.server.registerQueryBuilder(voucherQueries);
    this.server.registerModel(voucherModels);

    this.server.registerModel(fileModels);

    this.server.regsiterEventListener(jobEvent);
    this.server.regsiterEventListener(longTaskEvent);
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