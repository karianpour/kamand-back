import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { PoolClient, QueryConfig } from 'pg';
import { Server as KamandServer } from '../server';

type QueryFunction = (queryParams: any) => QueryConfig;

export interface QueryBuilder {
  query: string,
  public?: boolean,
  authorize?: (user:any) => boolean,
  createQueryConfig: QueryFunction,
}

type RouteFunction = () => fastify.RouteOptions<Server, IncomingMessage, ServerResponse, fastify.DefaultQuery, fastify.DefaultParams, fastify.DefaultHeaders, any>[];

export interface ModelAction {
  address: () => string;
  public?: boolean,
  authorize?: (user:any) => boolean,
  act: (client: PoolClient, actionParam: any) => Promise<any>,
}

type ModelActionFunction = () => ModelAction[];

export interface Model {
  address: () => string,
  routes: RouteFunction,
  actions: ModelActionFunction,
  setServer: (server: KamandServer) => void,
}