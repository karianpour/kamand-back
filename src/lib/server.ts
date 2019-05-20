import { HttpServer } from './services/http-server';
import { DataService } from './services/data-service';
import { Model, QueryBuilder } from './services/interfaces';

export class Server {
  private dataService: DataService;
  private httpServer: HttpServer;

  async run(
    host: string = '0.0.0.0',
    port: number = 8050,
  ){
    this.dataService = new DataService();
    await this.dataService.connect();

    this.httpServer = new HttpServer(this.dataService, host, port);
    this.httpServer.start();
  }

  getDataService(): DataService{
    return this.dataService;
  }

  getHttpServer(): HttpServer{
    return this.httpServer;
  }

  registerQueryBuilder(queryBuilders: QueryBuilder[]): void{
    this.dataService.registerQueryBuilder(queryBuilders);
  }

  registerModel(models: Model[]): void{
    this.httpServer.registerModelRoutes(models);
    this.dataService.registerModelActions(models);
    models.forEach( model => model.setServer(this));
  }
}
