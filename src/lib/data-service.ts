import {Pool, PoolConfig, PoolClient, QueryConfig} from 'pg';
import * as Debug from 'debug';
import { Unauthorized } from 'http-errors';

let debug = Debug('kamand');

type QueryFunction = (queryParams: any) => QueryConfig;

export interface QueryBuilder {
  query: string,
  public?: boolean,
  authorize?: (user:any) => boolean,
  createQueryConfig: QueryFunction,
}

export class DataService {

  private config: PoolConfig;
  private dataPool: Pool;
  private queryBuilders: Map<string, QueryBuilder>;

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
  }

  registerQueryBuilder(queryBuilders: QueryBuilder[]): void{
    queryBuilders.forEach( queryBuilder =>{
      this.queryBuilders.set(queryBuilder.query, queryBuilder);
    });
  }

  async connect(){
    this.dataPool = new Pool(this.config);
    this.dataPool.on('error', (error)=>{
      debug(`pg unhandled error ${error}`);
    });

    debug(`connected to pg ${this.config.host}`);
  }

  async query(query: string, queryParams: any, user?:any){
    let client: PoolClient;
    try {

      debug(JSON.stringify(this.queryBuilders, null, 2))

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
}
