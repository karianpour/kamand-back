import { QueryBuilder } from "../lib/index";

const publicQuery:QueryBuilder = {
  query: 'publicQuery',
  public: true,
  createQueryConfig: (queryParams)=>{

    const { type_name } = queryParams;

    console.log(`type_name is ${type_name}`);

    return {
      text: `
        select (generate_series % 12 + 1) as month, 'aaaa' as type_name, generate_series % 3 as count
        from generate_series(1, 50)
        order by 1, 2;
      `,
      values: [],
      //   rowMode: 'array',
    };
  }
}


export const queries = [publicQuery];