import { Model, Server, QueryBuilder } from "../lib/index";
import { PoolClient } from "pg";
import { HTTPMethods } from "fastify";
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
      method: 'POST' as HTTPMethods,
      public: true,
      url: '/login',
      schema: {
      },
      handler: this.handleLogin
    }, {
      method: 'POST' as HTTPMethods,
      public: true,
      url: '/forgot',
      schema: {
      },
      handler: this.handleForgot
    }];
  }

  actions() {
    return [
      {
        address: () => '/login',
        public: true,
        act: this.actLogin,
      },
      {
        address: () => '/forgot',
        public: true,
        act: this.actForgot,
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
    await pause(500);//this pause is to make the life of hacker harder for brute-force attack
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

  handleForgot = async (request, reply) => {
    const actionParam = {
      mobileNumber: request.body.mobileNumber || request.body.username,
    };
    const result = await this.server.getDataService().act(this.address()+'/forgot', actionParam);
    if(!result){
      await pause(500);//this pause is to make the life of hacker harder for brute-force attack
    }
    reply.send(result);
  }

  actForgot = async (client: PoolClient, actionParam: any) => {
    console.log({actionParam})
    if(actionParam.mobileNumber === '09121161998'){
      console.log('password reset')
      return true;
    }
    console.log('password not reset')
    return false;
  }
}

export const models: Model[] = [ 
  new Auth(),
];