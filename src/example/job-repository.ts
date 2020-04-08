import { Model, Server, QueryBuilder, EventListener } from "../lib/index";
import { PoolClient } from "pg";
import { HTTPMethod } from "fastify";
import { uniqueField } from '../lib/services/data-validators';
import { hasRole } from '../lib/services/auth-functions';
import { BadRequest, Conflict, ExpectationFailed, Unauthorized } from 'http-errors';
import { throwError, isValidNationalID, isValidMobileFormat, isValidPersianAlphabetFormat } from '../lib/services/value-validators';
import * as sql from 'sql-bricks-postgres';
import * as Debug from 'debug';
import { KamandSocket } from "../lib/services/websocket-service";
import { sleep } from "../lib/utils/generalUtils";

let debug = Debug('kamand-job');

class Job implements EventListener {
  private server: Server;

  setServer(s: Server) {
    this.server = s;
  }

  query = 'export-data';

  address() { return '/export-data'; }

  listener = async (socket: KamandSocket, data: any) => {
      // client: PoolClient, actionParam: any, user: any
      // this.server.getDataService()
      console.log({data});
      await sleep(3800);
      socket.emit(this.query, {step: 1});
      await sleep(3800);
      socket.emit(this.query, {step: 2});
      await sleep(3800);
      socket.emit(this.query, {step: 3});
      await sleep(3800);
      socket.emit(this.query, {step: 4});
      // const {id} = actionParam;

      // if(!user){
      //   throw new Unauthorized(`a user can do this action!`);
      // }

      // let select = sql.select(...fields);
      // select = select.from('acc a');
      // select = select.where(sql('id = $1', id));

      // const query = select.toParams();

      // const result = await client.query(query);

      // return result.rows.length > 0 ? result.rows[0] : null;
  }

  actions() {
    return [];
  }
}

export const listener: EventListener = new Job();

