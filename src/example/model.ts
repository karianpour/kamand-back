import { Model, Server } from "../lib/index";
import { PoolClient } from "pg";
import { HTTPMethod } from "fastify";

class Game implements Model {
  private server: Server;

  setServer(s: Server) { this.server = s; }

  address() { return '/games'; }

  routes() {
    return [{
      method: 'GET' as HTTPMethod,
      public: false,
      url: '/:id',
      schema: {
        // querystring: {
        //   name: { type: 'string' },
        //   excitement: { type: 'integer' }
        // },
        // response: {
        //   200: {
        //     type: 'object',
        //     properties: {
        //       id: { type: 'string' }
        //     }
        //   }
        // }
      },
      handler: async (request, reply) => {
        const actionParam = {id: request.params.id};
        const result = await this.server.getDataService().act(this.address()+'/findById', actionParam, request.user);
        reply.send(result);
      }
    }];
  }

  actions() {
    return [
      {
        address: () => '/findById',
        public: false,
        act: async (client: PoolClient, actionParam: any) => {
          const result = await client.query({
            text: `
              select *
              from game
              where id = $1;
            `,
            values: [actionParam.id],
            //   rowMode: 'array',
          });

          return result.rows.length > 0 ? result.rows[0] : null;
        },
      },
    ]
  }
}

const models: Model[] = [ 
  new Game(),
];

export default models;