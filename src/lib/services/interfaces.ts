import * as fastify from 'fastify';
import { Server, IncomingMessage, ServerResponse } from 'http';
import { PoolClient, QueryConfig } from 'pg';
import { Server as KamandServer } from '../server';
import { KamandSocket } from './websocket-service';

type PublicQueryFunction = (queryParams: any) => QueryConfig;
type QueryFunction = (queryParams: any, user: any) => QueryConfig;

type PublicPaginatedQueryFunction = (queryParams: any, offset: number, limit: number) => QueryConfig;
type PaginatedQueryFunction = (queryParams: any, offset: number, limit: number, user: any) => QueryConfig;

export interface QueryBuilder {
  query: string,
  public?: boolean,
  authorize?: (user:any) => boolean,
  createQueryConfig: QueryFunction,
}

export type PaginatedQueryBuilder = {
  query: string,
  type: "private",
  authorize: (user:any) => boolean,
  createQueryConfig: PaginatedQueryFunction,
} | {
  query: string,
  type: "public",
  createQueryConfig: PublicPaginatedQueryFunction,
};

type RouteFunction = () => (fastify.RouteOptions & {public: boolean})[];

export interface ModelAction {
  address: () => string;
  public: boolean,
  act: (client: PoolClient, actionParam: any, user?: any) => Promise<any>,
}

type ModelActionFunction = () => ModelAction[];

export interface Model extends Actionable {
  routes: RouteFunction,
  setServer: (server: KamandServer) => void,
}

export interface Actionable {
  address: () => string,
  actions: ModelActionFunction,
}

export interface EventListener extends Actionable {
  query: string;
  listener: (socket: KamandSocket, payload: any)=>Promise<void>;
  setServer: (server: KamandServer) => void,
}

export interface NotificationListener {
  channel: string;
  notify(payload?: string): void;
}