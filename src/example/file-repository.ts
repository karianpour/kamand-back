import { Model, Server, QueryBuilder } from "../lib/index";
import { PoolClient } from "pg";
import { HTTPMethod } from "fastify";
import { uniqueField } from '../lib/services/data-validators';
import { hasRole } from '../lib/services/auth-functions';
import { BadRequest, Conflict, ExpectationFailed, Unauthorized } from 'http-errors';
import { throwError, isValidNationalID, isValidMobileFormat, isValidPersianAlphabetFormat } from '../lib/services/value-validators';
import * as sql from 'sql-bricks-postgres';
import * as Debug from 'debug';

let debug = Debug('kamand-file');

class File implements Model {
  private server: Server;

  setServer(s: Server) { this.server = s; }

  address() { return '/file'; }

  routes() {
    return [{
      method: 'POST' as HTTPMethod,
      public: false,
      url: '/:id',
      schema: {
      },
      handler: this.handleUpload
    }];
  }

  actions() {
    return [
      {
        address: () => '/upload',
        public: false,
        act: this.actUpload,
      },
    ]
  }

  handleUpload = async (request, reply) => {
    console.log(request.raw.files);
    console.log(`param1 : ${request.body.param1}`);
    console.log(`param2: ${request.body.param2}`);
    console.log(`id: ${request.params.id}`);

    //K1 do something with the file
    const actionParam = {
      file: request.raw.files.file,
      id: request.params.id,
      param1: request.body.param1,
    };

    const result = await this.server.getDataService().act(this.address()+'/upload', actionParam, request.user);
    reply.send(result);
  }

  actUpload = async (client: PoolClient, actionParam: any, user: any) => {
    const { id, file, param1 } = actionParam;

    if(!(hasRole(user, 'admin'))){
      throw new Unauthorized(`only admin can execute this action!`);
    }

    if (!id) {
      const f = 'id';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }
    if (!file) {
      const f = 'file';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }
    if (!param1) {
      const f = 'param1';
      throwError(f, 'required', `${f} is missing!`, `example.${f}`);
    }

    // await uniqueField(client, 'acc', 'id', 'code', id, code, 'example.code');

    //K1 do something with the file and save it to database, I am too lazy to create sample here

    // const result = await client.query({
    //   text: ``,
    //   values: [ id ],
    // });

    // return result.rows.length > 0 ? result.rows[0] : null;
    return "ok";
  }
}

export const models: Model[] = [ 
  new File(),
];


/*

curl -F file=@./Pictures/20200114_162135.jpg -F param1=value1 -F param2=value2 -X POST http://localhost:8050/file/12344321

*/