import { snakeCase } from 'change-case';

export const snakeCasedFields = (fields:string[]) => fields.map(snakeCasedField);

export const snakeCasedField = (f: string): string => {
  if(f.indexOf(' as ') > -1) return f;
  const sf = snakeCase(f);
  return sf===f ? f : `${sf} as "${f}"`;
}