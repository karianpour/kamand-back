import { Server, ServerOptions, Socket } from 'socket.io';
import SocketIOServer = require('socket.io');
// import { RaceOrganiser } from './race/race-organiser';
// import { RaceController } from './race/race-controller';
import * as http from 'http';
import { Server as KamandServer } from '../server';

import * as Debug from 'debug';
import { EventListener } from './interfaces';

const debug = Debug('kamand:websocket');

// tslint:disable:no-any
export type SockIOMiddleware = (
  socket: Socket,
  fn: (err?: any) => void,
) => void;

export type KamandSocket = Socket & {user: any};
export type FutureUpdate = { socket: KamandSocket, payload: any };

export class WebSocketService {
  private io: Server;
  readonly httpServer: http.Server;
  readonly listeners: EventListener[] = [];
  
  private options: ServerOptions;
  private futureUpdates: Map<string, FutureUpdate[]>;
  private futureUpdateKeys: Map<string, string[]>;

  constructor(
    private server: KamandServer,
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
    this.futureUpdates = new Map();
    this.futureUpdateKeys = new Map();
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

  connection = (socket: KamandSocket)=>{
    socket.on('disconnect', (reason: string) => this.disconnected(socket, reason));
    socket.on('error', (error: any) => this.error(socket, error));
    socket.on('authorize', (data: string) => this.authorize(socket, data));
    this.listeners.forEach(listener => {
      socket.on(listener.query, (payload: any) => {
        listener.listener(socket, payload);
      });
    });
  }

  authorize = (socket: KamandSocket, data: string)=>{
    try {
      const payload: any = this.server.getHttpServer().verify(data);
      socket.user = payload;
    } catch (error) {
      debug(`error while verifying token with ${error}\n the token was: \n ${data}`);
    }
  }

  disconnected = (socket: KamandSocket, reason: string)=>{
    // debug(`socket ${socket.id} disconnected with reason ${reason}`);
    this.removeForFutureUpdateBySocket(socket);
  }

  error = (socket: KamandSocket, error: any)=>{
    debug(`socket ${socket.id} encountered error: ${error?.toString()}`);
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

  addForFutureUpdate(key: string, socket: KamandSocket, payload: any): void{
    const futureUpdates = this.futureUpdates.get(key);
    if(!futureUpdates){
      this.futureUpdates.set(key, [{socket, payload}]);
      this.addFutureUpdateKey(socket.id, key);
    }else{
      const index = futureUpdates.findIndex( futureUpdate => futureUpdate.socket === socket);
      if(index === -1){
        futureUpdates.push({socket, payload});
        this.addFutureUpdateKey(socket.id, key);
      }
    }
  }

  removeForFutureUpdate(key: string, socket: KamandSocket): void{
    const futureUpdates = this.futureUpdates.get(key);
    if(futureUpdates){
      const index = futureUpdates.findIndex(({socket: s}) => s === socket);
      if(index!==-1){
        futureUpdates.splice(index);
      }
    }
    this.removeFutureUpdateKey(socket.id, key);
  }

  findForFutureUpdate(key: string): FutureUpdate[]{
    return this.futureUpdates.get(key);
  }

  addFutureUpdateKey(socketId: string, key: string){
    const keys = this.futureUpdateKeys.get(socketId);
    if(!keys){
      this.futureUpdateKeys.set(socketId, [key]);
    }else{
      keys.push(key);
    }
  }

  removeFutureUpdateKey(socketId: string, key: string){
    const keys = this.futureUpdateKeys.get(socketId);
    if(keys){
      const index = keys.findIndex(k => k === key);
      if(index!==-1){
        keys.splice(index);
      }
    }
  }

  removeForFutureUpdateBySocket(socket: KamandSocket){
    const keys = this.futureUpdateKeys.get(socket.id);
    if(keys){
      keys.forEach( key => {
        const futureUpdates = this.futureUpdates.get(key);
        const index = futureUpdates.findIndex( ({socket: s}) => s === socket);
        if(index){
          futureUpdates.splice(index);
        }
      });
      this.futureUpdateKeys.delete(socket.id);
    }
  }
}
