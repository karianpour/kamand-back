import {HttpServer} from './services/http-server';
import {DataService} from './services/data-service';
import {WebSocketService} from './services/websocket-service';
import {Model, QueryBuilder, EventListener} from './services/interfaces';
import * as Debug from 'debug';

let debug = Debug('kamand');

export class Server {
  private dataService: DataService;
  private httpServer: HttpServer;
  private webSocketService: WebSocketService;

  async run(
    host: string = '0.0.0.0',
    port: number = 8050,
    logger: boolean = true,
    origin: boolean = true,
    socketHost: string = '0.0.0.0',
    socketPort: number = 8040,
  ) {
    debug('starting services');
    this.dataService = new DataService();
    await this.dataService.connect();

    this.httpServer = new HttpServer(this.dataService, host, port, logger, origin, undefined);
    this.httpServer.start();

    this.webSocketService = new WebSocketService(this, socketHost, socketPort);
    this.webSocketService.start();
  }

  listenNetwork(){
    this.httpServer.listenNetwork();
    this.webSocketService.listenNetwork();
  }

  getDataService(): DataService {
    return this.dataService;
  }

  getHttpServer(): HttpServer {
    return this.httpServer;
  }

  getWebSocketService(): WebSocketService {
    return this.webSocketService;
  }

  registerQueryBuilder(queryBuilders: QueryBuilder[]): void {
    this.dataService.registerQueryBuilder(queryBuilders);
  }

  registerModel(models: Model[]): void {
    this.httpServer.registerModelRoutes(models);
    this.dataService.registerModelActions(models);
    models.forEach(model => model.setServer(this));
  }

  regsiterEventListener(listener: EventListener): void {
    listener.setServer(this);
    this.webSocketService.registerListener(listener);
    this.dataService.registerModelActions([listener]);
  }

  async stop() {
    debug('stopping services');
    await this.httpServer.stop();
    await this.dataService.stop()
    await this.webSocketService.stop();
  }

}
