import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { PoolClient, QueryConfig } from 'pg';
import { Server as KamandServer } from '../server';
import { Socket } from 'socket.io';

type QueryFunction = (queryParams: any, user?: any) => QueryConfig;

export interface QueryBuilder {
  query: string,
  public?: boolean,
  authorize?: (user:any) => boolean,
  createQueryConfig: QueryFunction,
}

type RouteFunction = () => (fastify.RouteOptions<Server, IncomingMessage, ServerResponse, fastify.DefaultQuery, fastify.DefaultParams, fastify.DefaultHeaders, any> & {public: boolean})[];

export interface ModelAction {
  address: () => string;
  public: boolean,
  act: (client: PoolClient, actionParam: any, user?: any) => Promise<any>,
}

type ModelActionFunction = () => ModelAction[];

export interface Model {
  address: () => string,
  routes: RouteFunction,
  actions: ModelActionFunction,
  setServer: (server: KamandServer) => void,
}

export interface EventListener {
  query: string;
  listener: (socket: Socket, payload: any)=>Promise<void>;
  setServer: (server: KamandServer) => void,
}