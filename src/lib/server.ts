import { HttpServer } from './http-server';
import { DataService, QueryBuilder } from './data-service';

export class Server {
  private dataService: DataService;
  private httpServer: HttpServer;

  async run(){
    this.dataService = new DataService();
    await this.dataService.connect();

    this.httpServer = new HttpServer(this.dataService);
    this.httpServer.start();
  }

  registerQueryBuilder(queryBuilders: QueryBuilder[]): void{
    this.dataService.registerQueryBuilder(queryBuilders);
  }
}
