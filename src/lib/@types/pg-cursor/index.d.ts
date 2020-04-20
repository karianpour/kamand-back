// // Type definition for pg-cursor 2.1.9
// // Project: https://github.com/brianc/node-pg-cursor
// // Definitions by Kayvan Arianpour
// // 

// /// <reference types="node"/>


// declare module "pg-cursor" {

//   import { Submittable, Connection, QueryResultRow, QueryResult, QueryArrayResult } from 'pg';
//   import pgTypes = require('pg-types');

//   export = Cursor;

//   class Cursor implements Submittable{
//     constructor(text: String, values?: any[], config?: Cursor.CursorQueryConfig);
//     submit(connection: Connection):void;


//     read<R extends any[] = any[]>(rowCount: Number, callback: (err: Error, rows: R[], result: QueryArrayResult<R>) => void):void;
//     read<R extends QueryResultRow = any>(rowCount: Number, callback: (err: Error, rows: R[], result: QueryResult<R>) => void):void;

//     close(callback: (err: Error) => void): void;
//   }

//   namespace Cursor{
//     export interface CursorQueryConfig {
//       // by default rows come out as a key/value pair for each row
//       // pass the string 'array' here to receive rows as an array of values
//       rowMode?: string;
//       // custom type parsers just for this query result
//       types?: Types;
//     }
    
//     export interface Types {
//       getTypeParsers: (id: pgTypes.TypeId) => (value: string) => any;
//     }
//   }
// }
