import { QueryBuilder } from "../lib/index";

export const testQuery:QueryBuilder = {
  query: 'testQuery',
  createQueryConfig: (queryParams)=>{

    const year = queryParams.year || '1397';


    return {
      text: `
        select substring(InvoiceDate, 5, 2) as month, IT.Name as type_name, count(*)::int as count
        from Invoice I
        Inner join InvoiceType IT On IT.InvoiceTypeID = I.InvoiceTypeID
        where InvoiceDate Like $1 || '%' 
        group by 1, 2
        order by 1;
      `,
      values: [year],
        //   rowMode: 'array',
    };
  }
}