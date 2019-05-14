import { QueryBuilder } from "../lib/index";

const publicQuery:QueryBuilder = {
  query: 'publicQuery',
  public: true,
  createQueryConfig: (queryParams)=>{

    const year = queryParams.year || '1397';


    return {
      text: `
        select *
        from game;
      `,
      values: [],
        //   rowMode: 'array',
    };
  }
}

const privateQuery:QueryBuilder = {
  query: 'privateQuery',
  authorize: (user) => {
    return true;
  },
  createQueryConfig: (queryParams)=>{

    const year = queryParams.year || '1397';

    return {
      text: `
        select * from player;
      `,
      values: [],
        //   rowMode: 'array',
    };
  }
}

export const queries = [privateQuery, publicQuery];