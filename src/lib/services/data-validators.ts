import { PoolClient } from "pg";
import { camelCase } from 'change-case';
import { BadRequest, NotFound, Conflict } from 'http-errors';

export async function uniqueField(client: PoolClient, tableName: string, idField: string, uniqueField: string, idValue: any, uniqueFieldValue: any, fieldTranslation: string){
  const rr = await client.query({
    text:`select ${idField} from ${tableName} where ${uniqueField} = $2 and id != $1 limit 1`,
    values: [idValue, uniqueFieldValue]
  });
  if (rr && rr.rows.length > 0) {
    const field = camelCase(uniqueField);
    const error = new Conflict(JSON.stringify({
      codes: { [field]: [{code: 'duplicate', params: {field: fieldTranslation}}] },
      [field]: [`${field} already defined!`],
    }));
    throw error;
  }
}
