import { Model, Server, QueryBuilder } from "../lib/index";
import { PoolClient } from "pg";
import { HTTPMethod } from "fastify";
import { pause } from '../lib/utils/generalUtils';
import { throwError } from '../lib/services/value-validators';
import * as Debug from 'debug';

let debug = Debug('kamand');

class Auth implements Model {
  private server: Server;

  setServer(s: Server) { this.server = s; }

  address() { return '/users'; }

  routes() {
    return [{
      method: 'POST' as HTTPMethod,
      public: true,
      url: '/login',
      schema: {
      },
      handler: this.handleLogin
    }];
  }

  actions() {
    return [
      {
        address: () => '/login',
        public: true,
        act: this.actLogin,
      },
    ]
  }

  handleLogin = async (request, reply) => {
    const actionParam = {
      mobileNumber: request.body.mobileNumber || request.body.username,
      password: request.body.password,
    };
    const result = await this.server.getDataService().act(this.address()+'/login', actionParam);
    if(result){
      result.token = this.server.getHttpServer().sign({ id: result.id, roles: ['admin'] });
      reply.send(result);
    }
    await pause(500);//this pause is to avoid a hacker to brute-force attack
    throwError('mobileNumber', 'mismatch', 'mobileNumber mismatch!', 'auth.mobileNumber');
  }

  actLogin = async (client: PoolClient, actionParam: any) => {
    if(actionParam.mobileNumber === '09121161998' && actionParam.password === '123456'){
      return {
        id: '123456',
        name: 'kayvan',
      }
    }
    return null;
  }
}

export const models: Model[] = [ 
  new Auth(),
];