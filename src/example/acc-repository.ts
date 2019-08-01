import { Model, Server, QueryBuilder } from "../lib/index";
import { PoolClient } from "pg";
import { HTTPMethod } from "fastify";
import { uniqueField } from '../lib/services/data-validators';
import { hasRole } from '../lib/services/auth-functions';
import { BadRequest, Conflict, ExpectationFailed, Unauthorized } from 'http-errors';
import { throwError, isValidNationalID, isValidMobileFormat, isValidPersianAlphabetFormat } from '../lib/services/value-validators';
import * as sql from 'sql-bricks-postgres';
import * as Debug from 'debug';

let debug = Debug('kamand');

const fields: string[] = [
  'id',
  'code',
  'name',
  'created_at as "createdAt"',
];

const accQuery:QueryBuilder = {
  query: 'acc_list',
  public: false,
  authorize: (user: any)=>{
    return !!user;
  },
  createQueryConfig: (queryParams, user: any)=>{
    if(!(hasRole(user, ['admin']))){
      throw new Unauthorized(`only admin can execute this action!`);
    }

    let select = sql.select(...(fields.map(f => 'a.'+f)));
    select = select.from('acc a');

    if(queryParams.code){
      select = select.where(sql.ilike('a.code', `%${queryParams.code}%`));
    }
    if(queryParams.name){
      select = select.where(sql.ilike('a.name', `%${queryParams.name}%`));
    }
    select = select.limit('500');
    select = select.orderBy('a.code');

    const query = select.toParams();
    return query;
  }
}

class Acc implements Model {
  private server: Server;

  setServer(s: Server) { this.server = s; }

  address() { return '/acc'; }

  routes() {
    return [{
      method: 'GET' as HTTPMethod,
      public: false,
      url: '/:id',
      schema: {
      },
      handler: this.handleFindById
    },{
      method: 'POST' as HTTPMethod,
      public: true,
      url: '/:id',
      schema: {
      },
      handler: this.handleCreate
    },{
      method: 'PUT' as HTTPMethod,
      public: false,
      url: '/:id',
      schema: {
      },
      handler: this.handleUpdate
    }];
  }

  actions() {
    return [
      {
        address: () => '/findById',
        public: false,
        act: this.actFindById,
      },{
        address: () => '/create',
        public: true,
        act: this.actCreate,
      },{
        address: () => '/update',
        public: false,
        act: this.actUpdate,
      },
    ]
  }

  handleFindById = async (request, reply) => {
    const actionParam = {id: request.params.id};
    const result = await this.server.getDataService().act(this.address()+'/findById', actionParam, request.user);
    reply.send(result);
  }

  actFindById = async (client: PoolClient, actionParam: any, user: any) => {
    const {id} = actionParam;

    if(!user){
      throw new Unauthorized(`a user can do this action!`);
    }

    let select = sql.select(...fields);
    select = select.from('acc a');
    select = select.where(sql('id = $1', id));

    const query = select.toParams();

    const result = await client.query(query);

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  handleCreate = async (request, reply) => {
    const actionParam = request.body;

    const result = await this.server.getDataService().act(this.address()+'/create', actionParam, request.user);
    reply.send(result);
  }

  actCreate = async (client: PoolClient, actionParam: any, user: any) => {
    const { id, code, name, createdAt } = actionParam;

    if (!code) {
      const f = 'code';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }
    if (!name) {
      const f = 'name';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }
    if (!createdAt) {
      const f = 'createdAt';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }

    await uniqueField(client, 'acc', 'id', 'code', id, code, 'example.code');

    await uniqueField(client, 'acc', 'id', 'name', id, name, 'example.name');

    const result = await client.query({
      text: `
        insert into acc (
          id, code, name, created_at
        ) values ($1, $2, $3, $4)
        returning ${fields.join(', ')};
      `,
      values: [ id, code, name, createdAt ],
    });

    return result.rows[0];
  }

  handleUpdate = async (request, reply) => {
    const actionParam = request.body;

    const result = await this.server.getDataService().act(this.address()+'/update', actionParam, request.user);
    reply.send(result);
  }

  actUpdate = async (client: PoolClient, actionParam: any, user: any) => {
    const { id, code, name, createdAt } = actionParam;

    if(!(hasRole(user, 'admin'))){
      throw new Unauthorized(`only admin can execute this action!`);
    }

    if (!code) {
      const f = 'code';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }
    if (!name) {
      const f = 'name';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }
    if (!createdAt) {
      const f = 'createdAt';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }

    await uniqueField(client, 'acc', 'id', 'code', id, code, 'example.code');

    await uniqueField(client, 'acc', 'id', 'name', id, name, 'example.name');

    const result = await client.query({
      text: `
        update acc set (
          code, name, created_at
        ) = ($2, $3, $4)
        where id = $1
        returning ${fields.join(', ')};
      `,
      values: [ id, code, name, createdAt ],
    });

    return result.rows.length > 0 ? result.rows[0] : null;
  }
}

export const models: Model[] = [ 
  new Acc(),
];

export const queries = [ accQuery ]