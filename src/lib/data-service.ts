import {Pool, PoolConfig, PoolClient, QueryConfig} from 'pg';
import * as Debug from 'debug';

let debug = Debug('kamand');

type QueryFunction = (queryParams: any) => QueryConfig;

export interface QueryBuilder {
  query: string,
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

  registerQueryBuilder(queryBuilder: QueryBuilder): void{
    this.queryBuilders.set(queryBuilder.query, queryBuilder);
  }

  async connect(){
    this.dataPool = new Pool(this.config);
    this.dataPool.on('error', (error)=>{
      debug(`pg unhandled error ${error}`);
    });

    debug(`connected to pg ${this.config.host}`);
  }

  async query(query: string, queryParams: any){
    let client: PoolClient;
    try {

      debug(JSON.stringify(this.queryBuilders, null, 2))

      const queryBuilder = this.queryBuilders.get(query);

      if(!queryBuilder){
        throw new Error(`query ${query} not found!`);
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
