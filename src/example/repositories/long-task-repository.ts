import { Model, Server, QueryBuilder, EventListener } from "../../lib/index";
import { PoolClient } from "pg";
import { HTTPMethods } from "fastify";
import { uniqueField } from '../../lib/services/data-validators';
import { hasRole } from '../../lib/services/auth-functions';
import { BadRequest, Conflict, ExpectationFailed, Unauthorized } from 'http-errors';
import { throwError, isValidNationalID, isValidMobileFormat, isValidPersianAlphabetFormat } from '../../lib/services/value-validators';
import * as sql from 'sql-bricks-postgres';
import * as Debug from 'debug';
import { KamandSocket } from "../../lib/services/websocket-service";
import { sleep, camelCaseObject } from "../../lib/utils/generalUtils";
import { snakeCasedFields } from "../../lib/utils/dbUtils";
import { iterateOnQuery } from "../../lib/services/data-service";

let debug = Debug('kamand-long-task');

const ProgressTotalStep = 22;

const fields: string[] = snakeCasedFields([
  'id',
  'title',
  'createdAt',
  'progress',
  'finishedAt',
]);

class LongTask implements EventListener {
  private server: Server;

  setServer(s: Server) {
    this.server = s;
    this.server.getDataService().registerNotificationListener({
      channel: 'long_task_update',
      notify: this.onLongTask,
    });
  }

  query = 'long-task';

  address() { return '/long-task'; }

  listener = async (socket: KamandSocket, data: any) => {
    if(data.sendList){
      const result = await this.server.getDataService().act(this.address()+'/list', {}, socket.user);
      socket.emit(this.query, {list: result});
    }else if(data.sendInitialData){
      const { id } = data.sendInitialData;
      const result = await this.server.getDataService().act(this.address()+'/initialData', { id }, socket.user);
      socket.emit(this.query, {initialData: result});
      if(!result.finishedAt){
        this.server.getWebSocketService().addForFutureUpdate(`${this.address()}/${id}`, socket, {});
      }
    }else if(data.start){
      const { id, title } = data.start;
      const result = await this.server.getDataService().act(this.address()+'/start', { id, title }, socket.user);
      this.server.getWebSocketService().addForFutureUpdate(`${this.address()}/${result.id}`, socket, {});
    }else if(data.leave){
      const { id } = data.leave;
      this.server.getWebSocketService().removeForFutureUpdate(`${this.address()}/${id}`, socket);
    }
  }

  onLongTask = async (payload: string) => {
    const { id } = JSON.parse(payload);
    const futureUpdates = this.server.getWebSocketService().findForFutureUpdate(`${this.address()}/${id}`);
    
    if(futureUpdates){
      await Promise.all(futureUpdates.map(async ({socket, payload}) => {
        const result = await this.server.getDataService().act(this.address()+'/findById', { id }, socket.user);
        socket.emit(this.query, {progress: result});
        if(result.finishedAt){
          this.server.getWebSocketService().removeForFutureUpdate(`${this.address()}/${result.id}`, socket);
        }
      }));
    }
  }

  actions() {
    return [
      {
        address: () => '/list',
        public: false,
        act: this.actList,
      }, {
        address: () => '/initialData',
        public: false,
        act: this.actInitialData,
      }, {
        address: () => '/findById',
        public: false,
        act: this.actFindById,
      }, {
        address: () => '/start',
        public: false,
        act: this.actStart,
      }, {
        address: () => '/progress',
        public: false,
        act: this.actProgress,
      },
    ]
  }

  actList = async (client: PoolClient, actionParam: any, user: any) => {
    // const { id, file, param1 } = actionParam;

    // if(!(hasRole(user, 'admin'))){
    //   throw new Unauthorized(`only admin can execute this action!`);
    // }

    let select = sql.select(...(fields.map(f => 'lt.'+f)));
    select = select.select(`${ProgressTotalStep} as "progressTotalStep"`);
    select = select.from('long_task lt');
    select = select.limit(5);
    select = select.orderBy('lt.created_at desc');

    const query = select.toParams();

    const result = await client.query(query);

    return camelCaseObject(result.rows);
  }

  actInitialData = async (client: PoolClient, actionParam: any, user: any) => {
    const { id } = actionParam;

    // if(!(hasRole(user, 'admin'))){
    //   throw new Unauthorized(`only admin can execute this action!`);
    // }

    let select = sql.select(...(fields.map(f => 'lt.'+f)));
    select = select.select(`${ProgressTotalStep} as "progressTotalStep"`);
    select = select.from('long_task lt');
    select = select.where(sql('id = $1', id));

    const query = select.toParams();

    const result = await client.query(query);

    return result.rows.length > 0 ? camelCaseObject(result.rows[0]) : null;
  }

  actFindById = async (client: PoolClient, actionParam: any, user: any) => {
    const { id } = actionParam;

    // if(!(hasRole(user, 'admin'))){
    //   throw new Unauthorized(`only admin can execute this action!`);
    // }

    let select = sql.select(...(fields.map(f => 'lt.'+f)));
    select = select.select(`${ProgressTotalStep} as "progressTotalStep"`);
    select = select.from('long_task lt');
    select = select.where(sql('id = $1', id));

    const query = select.toParams();

    const result = await client.query(query);

    return result.rows.length > 0 ? camelCaseObject(result.rows[0]) : null;
  }

  actStart = async (client: PoolClient, actionParam: any, user: any) => {
    const { id, title } = actionParam;

    // if(!(hasRole(user, 'admin'))){
    //   throw new Unauthorized(`only admin can execute this action!`);
    // }

    const result = await client.query({
      text: `
        insert into long_task (
          id, title, created_at, progress, finished_at
        ) values ($1, $2, now(), 0, null)
        returning ${fields.join(', ')};
      `,
      values: [ id, title ],
    });

    setImmediate(() => this.doLongTask(id, user));

    const started = camelCaseObject(result.rows[0]);
    started.progressTotalStep = ProgressTotalStep;
    return started;
  }

  actProgress = async (client: PoolClient, actionParam: any, user: any) => {
    const { id, progress, finished } = actionParam;

    await client.query({
      text: `
        update long_task set (progress, finished_at) = ($2, (case when $3 then now() else null end))
        where id = $1
        returning progress, finished_at;
      `,
      values: [ id, progress, !!finished ],
    });

  }

  doLongTask = async (id: string, user: any) => {
    let client: PoolClient;
    
    try{
      client = await this.server.getDataService().giveDbClient();
      await client.query('begin transaction isolation level serializable;');
      // here you can use this client for long task like backup

      const itor = iterateOnQuery(client, {text: 'select * from generate_series(0, 500)'}, 10, true);

      for await (let r of itor){
        console.log(r.rows);
      }


    
      let progress: number = 0, finished: boolean = false;

      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      await sleep(4000);
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      progress++;
      finished = true;
      await this.server.getDataService().act(this.address()+'/progress', { id, progress, finished }, user);
      if(progress !== ProgressTotalStep){
        debug(`Progress (${progress}) finished with different step than ProgressTotalStep (${ProgressTotalStep})`);
      }
    

    } catch (error) {
      if(client){
        try {
          await client.query('rollback');
        } catch (error) {}
      }
      throw error;
    }finally{
      try {
        client?.release();
      } catch (error) {}
    }

  }
}

export const listener: EventListener = new LongTask();

