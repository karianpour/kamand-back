import * as fastify from 'fastify';

declare module "fastify" {
  interface FastifyInstance {
    authenticate(): void;
  }

  // K1 : it is declared in the fastify-jwt package
  // export interface FastifyRequest
  // {
  //   user(): any;
  // }
}