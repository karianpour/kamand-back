import {Pool, PoolConfig, PoolClient} from 'pg';
import * as Debug from 'debug';
import { Unauthorized } from 'http-errors';
import { QueryBuilder, ModelAction, Model } from './interfaces';

let debug = Debug('kamand');

export class DataService {

  private config: PoolConfig;
  private dataPool: Pool;
  private queryBuilders: Map<string, QueryBuilder>;
  private actions: Map<string, ModelAction>;

  constructor(){
    this.config = {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT || '5432'),
      password: process.env.DB_PASS,
      user: process.env.DB_USER,
      database: process.env.DB_DATABASE,
      max: 10,
      idleTimeoutMillis: 5 * 60 * 1000,
      connectionTimeoutMillis: 10 * 1000,
    };

    this.queryBuilders = new Map();
    this.actions = new Map();
  }

  async connect(){
    this.dataPool = new Pool(this.config);
    this.dataPool.on('error', (error)=>{
      debug(`pg unhandled error ${error}`);
    });

    debug(`connected to pg ${this.config.host}`);
  }

  registerQueryBuilder(queryBuilders: QueryBuilder[]): void{
    queryBuilders.forEach( queryBuilder =>{
      this.queryBuilders.set(queryBuilder.query, queryBuilder);
    });
  }

  async query(query: string, queryParams: any, user?:any){
    let client: PoolClient;
    try {

      // debug(JSON.stringify(this.queryBuilders, null, 2))

      const queryBuilder = this.queryBuilders.get(query);

      if(!queryBuilder){
        throw new Error(`query ${query} not found!`);
      }

      if(!queryBuilder.public){
        if(!user){
          throw new Unauthorized(`no user defined`);
        }
        if(!queryBuilder.authorize){
          throw new Unauthorized(`no authorize function defined!`);
        }
        if(!queryBuilder.authorize(user)){
          throw new Unauthorized(`user has no access`);
        }
      }

      client = await this.dataPool.connect();

      const result = await client.query(queryBuilder.createQueryConfig(queryParams));
      client.release();

      return result.rows;
    } catch (error) {
      if(client){
        try {
          client.release(error);
        } catch (error) {}
      }
      throw error;
    }
  }

  registerModelActions(models: Model[]): void{
    models.forEach( model => {
      const modelAddress = model.address();
      const actions = model.actions();
      actions.forEach( action =>{
        this.actions.set(modelAddress + action.address(), action);
      });
    });
  }

  async act(address: string, actionParams: any, user?:any){
    let client: PoolClient;
    try {

      // debug(JSON.stringify(this.queryBuilders, null, 2))

      const action = this.actions.get(address);

      if(!action){
        throw new Error(`action ${address} not found!`);
      }

      if(!action.public){
        if(!user){
          throw new Unauthorized(`no user defined`);
        }
        if(!action.authorize){
          throw new Unauthorized(`no authorize function defined!`);
        }
        if(!action.authorize(user)){
          throw new Unauthorized(`user has no access`);
        }
      }

      client = await this.dataPool.connect();

      //FIXME it should be done in a transaction
      const result = await action.act(client, actionParams);

      client.release();

      return result;
    } catch (error) {
      if(client){
        try {
          client.release(error);
        } catch (error) {}
      }
      throw error;
    }
  }
}