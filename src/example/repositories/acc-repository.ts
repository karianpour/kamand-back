import { Model, Server, QueryBuilder } from "../../lib/index";
import { PoolClient } from "pg";
import { HTTPMethods } from "fastify";
import { syncLogApiBody } from '../../lib/services/data-service';
import { uniqueField } from '../../lib/services/data-validators';
import { hasRole } from '../../lib/services/auth-functions';
import { BadRequest, Conflict, ExpectationFailed, Unauthorized } from 'http-errors';
import { throwError, isValidNationalID, isValidMobileFormat, isValidPersianAlphabetFormat } from '../../lib/services/value-validators';
import * as sql from 'sql-bricks-postgres';
import * as Debug from 'debug';

let debug = Debug('kamand-acc');

const fields: string[] = [
  'id',
  'parent_id as "parentId"',
  'code',
  'name',
  'level',
  'leaf',
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

const accStatQuery:QueryBuilder = {
  query: 'accStat',
  public: false,
  authorize: (user: any)=>{
    return !!user;
  },
  createQueryConfig: (queryParams, user: any)=>{
    // if(!(hasRole(user, ['admin']))){
    //   throw new Unauthorized(`only admin can execute this action!`);
    // }
    const {accId} = queryParams;

    // if(!bookId){
    //   throw new ExpectationFailed(`bookId is needed!`);
    // }

    let select = sql.select([
      'acc.code as "accCode"',
      'acc.name as "accName"',
      'sum(art.amount) filter (where art.amount > 0) as "debitAmount"',
      'sum(-art.amount) filter (where art.amount < 0) as "creditAmount"',
      'sum(art.amount) as "amount"',
      'acc.level',
      'acc.id as "accId"',
      'acc.leaf',
    ]);
    select = select.from('acc acc');
    select = select.leftJoin('article art').on('art.acc_id', 'acc.id');
    select = select.innerJoin('voucher vou').on('vou.id', 'art.voucher_id');

    select = select.where({'vou.registered': true});
    if(accId){
      select = select.where({'acc.parent_id': accId});
    }

    select = select.groupBy('1, 2, 6, 7, 8');
    select = select.orderBy('abs(sum(art.amount)) desc');

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
      method: 'GET' as HTTPMethods,
      public: true,
      url: '/:id',
      schema: {
        description: 'get acc',
        tags: ['acc'],
        summary: 'acc',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
        },
        // // querystring:{//todo need this part?
        //   type: 'object',
        //   properties: {
        //     id: { type: 'string' },
        //   },
        //   required: ['id']
        // },
        // body: {
        //   type: 'object',
        //   properties: {
        //     id: { type: 'string' },
        //   },
        //   required: ['id']
        // },
        response: {
          200: {
            description: 'Successful response',
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              token: { type: 'string' },
            }
          }
        },
        security: [
          {
            "apiKey": []
          }
        ]
      },
      handler: this.handleFindById,
      onRequest: this.onRequest

    },{
      method: 'POST' as HTTPMethods,
      public: false,
      url: '/:id',
      schema: {
      },
      handler: this.handleCreate
    },{
      method: 'PUT' as HTTPMethods,
      public: false,
      url: '/:id',
      schema: {
      },
      handler: this.handleUpdate
    },{
      method: 'POST' as HTTPMethods,
      public: true,
      url: '/file/:id',
      schema: {
      },
      handler: this.handleFile
    }];
  }

  actions() {
    return [
      {
        address: () => '/findById',
        public: true,
        act: this.actFindById,
      },{
        address: () => '/create',
        public: false,
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
    const { id, parentId, code, name, level, leaf, createdAt } = actionParam;

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
          id, parent_id, code, name, level, leaf, created_at
        ) values ($1, $2, $3, $4, $5, $6, $7)
        returning ${fields.join(', ')};
      `,
      values: [ id, parentId, code, name, level, leaf, createdAt ],
    });

    return result.rows[0];
  }

  onRequest = async (request, reply) => {
    console.log("I'm here");
    syncLogApiBody(  request, this.server, 'get Acc');

  }

  handleUpdate = async (request, reply) => {
    const actionParam = request.body;

    const result = await this.server.getDataService().act(this.address()+'/update', actionParam, request.user);
    reply.send(result);
  }

  actUpdate = async (client: PoolClient, actionParam: any, user: any) => {
    const { id, parentId, code, name, level, leaf, createdAt } = actionParam;

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
          parent_id, code, name, level, leaf, created_at
        ) = ($2, $3, $4, $5, $6, $7)
        where id = $1
        returning ${fields.join(', ')};
      `,
      values: [ id, parentId, code, name, level, leaf, createdAt ],
    });

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  handleFile = async (request, reply) => {
    console.log(request.raw.files);
    console.log(`param1 : ${request.body.param1}`);
    console.log(`param2: ${request.body.param2}`);
    console.log(`id: ${request.params.id}`);

    reply.send({response: 'mehrnoosh is learning linux and nodejs'});
  }
}

export const models: Model[] = [ 
  new Acc(),
];

export const queries = [ accQuery, accStatQuery ]