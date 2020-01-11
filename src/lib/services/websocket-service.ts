import { Server, ServerOptions, Socket } from 'socket.io';
import SocketIOServer = require('socket.io');
// import { RaceOrganiser } from './race/race-organiser';
// import { RaceController } from './race/race-controller';
import * as http from 'http';

import * as Debug from 'debug';
import { EventListener } from './interfaces';

const debug = Debug('kamand:websocket');

// tslint:disable:no-any
export type SockIOMiddleware = (
  socket: Socket,
  fn: (err?: any) => void,
) => void;

export class WebSocketService {
  private io: Server;
  readonly httpServer: http.Server;
  readonly listeners: EventListener[] = [];
  
  private options: ServerOptions;

  constructor(
    private host: string,
    private port: number,
  ) {
    this.options = {
      path: '/kamand-io',
      serveClient: false,
      cookie: false,
    };
    this.io = SocketIOServer(this.options);
    this.httpServer = http.createServer();
  }

  use(fn: SockIOMiddleware) {
    return this.io.use(fn);
  }

  // route() {
  //   const namespace = '/race';
  //   const nsp = namespace ? this.io.of(namespace) : this.io;
  //   nsp.on('connect', async socket => {
  //     debug(
  //       'Websocket connected: id=%s namespace=%s',
  //       socket.id,
  //       socket.nsp.name,
  //     );
  //     new RaceController(socket, this.raceOrganiser);
  //   });
  // }

  registerListener(listener: EventListener) {
    this.listeners.push(listener);
  }

  connection = (socket: Socket)=>{
    this.listeners.forEach(listener => {
      socket.on(listener.query, (payload: any) => {
        listener.listener(socket, payload);
      });
    });
  }

  getIo() {
    return this.io;
  }

  async start() {
    debug(`websocket starting ${this.host} ${this.port}`);
    this.httpServer.listen(this.port, this.host);
    this.io.attach(this.httpServer, this.options);
    this.io.on('connection', this.connection);
    debug('websocket started');
  }

  async stop() {
    this.httpServer.close();
    const close = new Promise<void>((resolve, reject) => {
      this.io.close(() => {
        resolve();
      });
    });
    await close;
  }
}
