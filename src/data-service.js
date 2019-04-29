const {Pool} = require('pg');

class DataService {
  constructor(){
      this.config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        password: process.env.DB_PASS,
        user: process.env.DB_USER,
        database: process.env.DB_DATABASE,
        max: 10,
        idleTimeoutMillis: 5 * 60 * 1000,
        connectionTimeoutMillis: 10 * 1000,
      };
  }

  async connect(){
      this.dataPool = new Pool(this.config);
      this.dataPool.on('error', ()=>{
          console.log(`pg unhandled error ${error}`);
      });

      console.log(`connected to pg ${this.config.host}`);
  }

  async query(){
      let client;
      try {
          client = await this.dataPool.connect();

          const result = await client.query({
              text: `
              select substring(InvoiceDate, 5, 2) as month, IT.Name as type_name, count(*)::int as count
              from Invoice I
              Inner join InvoiceType IT On IT.InvoiceTypeID = I.InvoiceTypeID
              where InvoiceDate Like $1 || '%' 
              group by 1, 2
              order by 1;
              `,
              values: ['1397'],
            //   rowMode: 'array',
          });
          client.release();

          return result.rows;
      } catch (error) {
          if(client){
              try {
                  client.release(error);
              } catch (error) {}
          }
          throw error;
      }
  }

}

module.exports = DataService;