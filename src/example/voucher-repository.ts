import { Model, Server, QueryBuilder } from "../lib/index";
import { PoolClient } from "pg";
import { HTTPMethod } from "fastify";
import { uniqueField } from '../lib/services/data-validators';
import { hasRole } from '../lib/services/auth-functions';
import { BadRequest, Conflict, ExpectationFailed, Unauthorized } from 'http-errors';
import { throwError, isValidNationalID, isValidMobileFormat, isValidPersianAlphabetFormat, createError } from '../lib/services/value-validators';
import * as sql from 'sql-bricks-postgres';
import * as format from 'pg-format';
import * as Debug from 'debug';

let debug = Debug('kamand');

const voucherFields: string[] = [
  'id',
  'voucher_no as "voucherNo"',
  'voucher_date as "voucherDate"',
  'voucher_type as "voucherType"',
  'acc_id as "accId"',
  'registered',
  'amount',
  'refer',
  'remark',
  'created_at as "createdAt"',
];

const articleFields: string[] = [
  'id',
  'voucher_id as "voucherId"',
  'article_no as "articleNo"',
  'article_date as "articleDate"',
  'acc_id as "accId"',
  'voucher_type as "voucherType"',
  'registered',
  'amount',
  'refer',
  'remark',
  'created_at as "createdAt"',
];

const voucherQuery:QueryBuilder = {
  query: 'voucher_list',
  public: false,
  authorize: (user: any)=>{
    return !!user;
  },
  createQueryConfig: (queryParams, user: any)=>{
    if(!(hasRole(user, ['admin']))){
      throw new Unauthorized(`only admin can execute this action!`);
    }

    let select = sql.select(...(voucherFields.map(f => 'v.'+f)));
    select = select.from('voucher v');

    if(queryParams.voucherNo){
      select = select.where(sql.eq('v.voucher_no', queryParams.voucherNo));
    }
    if(queryParams.voucherDate){
      select = select.where(sql.eq('v.voucher_date', queryParams.voucherDate));
    }
    if(queryParams.refer){
      select = select.where(sql.ilike('v.refer', `%${queryParams.refer}%`));
    }
    select = select.limit('500');
    select = select.orderBy('v.voucher_no');

    const query = select.toParams();
    return query;
  }
}

const report:QueryBuilder = {
  query: 'report',
  public: false,
  authorize: (user: any)=>{
    return !!user;
  },
  createQueryConfig: (queryParams)=>{

    const { accId } = queryParams;

    let select = sql.select(
      'acc.code as "accCode"',
      'acc.name as "accName"',
      'sum(a.amount) as "amount"',
      'acc.id as "accId"',
    );
    select = select.from('voucher v');
    select = select.innerJoin('article a').on('v.id', 'a.voucher_id');
    select = select.innerJoin('acc acc').on('acc.id', 'a.acc_id');

    if(accId){
      select = select.where({'acc.id': accId});
    }
    select = select.limit('500');
    select = select.groupBy('1, 2, 4');
    select = select.orderBy('acc.code');

    const query = select.toParams();

    return query;
  }
}

class Voucher implements Model {
  private server: Server;

  setServer(s: Server) { this.server = s; }

  address() { return '/voucher'; }

  routes() {
    return [{
      method: 'GET' as HTTPMethod,
      public: false,
      url: '/:id',
      schema: {
      },
      handler: this.handleFindById
    },{
      method: 'GET' as HTTPMethod,
      public: false,
      url: '/print/:id',
      schema: {
      },
      handler: this.handlePrintById
    },{
      method: 'POST' as HTTPMethod,
      public: true,
      url: '/:id',
      schema: {
      },
      handler: this.handleCreate
    }];
  }

  actions() {
    return [
      {
        address: () => '/findById',
        public: false,
        act: this.actFindById,
      },{
        address: () => '/printById',
        public: false,
        act: this.actPrintById,
      },{
        address: () => '/create',
        public: true,
        act: this.actCreate,
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

    let voucher;

    {
      let select = sql.select(...voucherFields);
      select = select.from('voucher v');
      select = select.where(sql('id = $1', id));
  
      const query = select.toParams();
  
      const result = await client.query(query);
      voucher = result.rows.length === 0 ? null : result.rows[0];
    }

    if(voucher){
      let select = sql.select(...articleFields);
      select = select.from('article a');
      select = select.where(sql('voucher_id = $1', id));
  
      const query = select.toParams();
  
      const result = await client.query(query);
      voucher.articles = result.rows.length === 0 ? [] : result.rows;
    }

    return voucher;
  }

  handlePrintById = async (request, reply) => {
    const actionParam = {id: request.params.id};
    const result = await this.server.getDataService().act(this.address()+'/printById', actionParam, request.user);
    reply.send(result);
  }

  actPrintById = async (client: PoolClient, actionParam: any, user: any) => {
    const {id} = actionParam;

    if(!user){
      throw new Unauthorized(`a user can do this action!`);
    }

    const sql = `
    select 
      json_build_object(
        'voucherNo',
        v.voucher_no,
        'voucherDate',
        v.voucher_date,
        'refer',
        v.refer,
        'remark',
        v.remark,
        'registered',
        v.registered,
        'articles',
        art.articles
      )::text as voucher
    from voucher v
    left join lateral (
      select art.voucher_id, 
        array_to_json(
          array_agg(
            json_build_object(
              'id',
              art.id,
              'articleNo',
              art.article_no,
              'accCode',
              acc.code,
              'accName',
              acc.name,
              'amount',
              art.amount,
              'refer',
              art.refer,
              'remark',
              art.remark
            )
          )
        ) as articles
      from article art
      left join acc acc on art.acc_id = acc.id
      where art.voucher_id = v.id
      group by 1
    ) art on true
    where v.id = $1
    `;

    const query = {
      text: sql,
      values: [id]
    };

    try{
      const result = await client.query(query);
      return result.rows.length > 0 ? result.rows[0].voucher : null;
    }catch(err){
      console.log(err)
      throw err;
    }

  }

  handleCreate = async (request, reply) => {
    const actionParam = request.body;

    const result = await this.server.getDataService().act(this.address()+'/create', actionParam, request.user);
    reply.send(result);
  }

  actCreate = async (client: PoolClient, actionParam: any, user: any) => {
    const {
      id,
      voucherNo,
      voucherDate,
      voucherType,
      accId,
      registered,
      amount,
      refer,
      remark,
      createdAt,
      articles,
    } = actionParam;
/*
  better approach for error throwing

    const err: any[] = [];
    err.push(createError(``, 'lockedItem', `fiscal is locked!`, {field: 'pbl.fiscal'}));
    err.push(createError(`registered`, 'lockedItem', `fiscal is locked!`, {field: 'pbl.fiscal'}));
    if(err.length > 0){
      throw new ExpectationFailed(JSON.stringify(err));
    }
*/
    if (!id) {
      const f = 'id';
      throwError(f, 'required', `${f} is missing!`, `data.${f}`);
    }
    // {  // if the error is in an array, the format is as follow :
    //   const f = 'articleNo';
    //   throwError(`articles.0.${f}`, 'required', `${f} is missing!`, `data.${f}`);
    // }
    if (!voucherNo) {
      const f = 'voucherNo';
      throwError(f, 'required', `${f} is missing!`, `data.${f}`);
    }
    //... the rest should be checked as well
    if (!createdAt) {
      const f = 'createdAt';
      throwError(f, 'required', `${f} is missing!`, `data.${f}`);
    }

    await uniqueField(client, 'voucher', 'id', 'voucher_no', id, voucherNo, 'data.voucherNo');

    let upsert = sql.insert('voucher', {
      id,
      voucher_no: voucherNo,
      voucher_date: voucherDate,
      voucher_type: voucherType,
      acc_id: accId,
      registered,
      amount,
      refer,
      remark,
      created_at: createdAt,
    })
      .onConflict('id')
      .doUpdate()
      .returning(voucherFields);

    const result = await client.query(upsert.toParams());

    const voucher = result.rows[0];

    await client.query({
      text: `
        delete from article where voucher_id = $1
      `,
      values: [ id ],
    });

    if(articles && Array.isArray(articles) && articles.length > 0){
      const dataArray = articles.map( (v: any) => ([
        v.id, id, v.articleNo, v.articleDate, v.accId, v.voucherType, v.registered, v.amount, v.refer, v.remark, v.createdAt,
      ]));
      const contentQuery = format(`
        insert into article (
          id, voucher_id, article_no, article_date, acc_id, voucher_type, registered, amount, refer, remark, created_at
        ) values %L %s`, dataArray, `returning ${articleFields.join(', ')}`
      );

      await client.query(contentQuery);
    }

    return voucher;
  }
}

export const models: Model[] = [ 
  new Voucher(),
];

export const queries = [ voucherQuery, report ];