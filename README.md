# Dev & Debug

In order to start the example

```bash
npm start
```

If you want to re-run as you save a file

```bash
npm run start:watch
```

# Publish

```bash
npm run build
npm publish
```

# Tests
All tests are located inside the `src/test` folder.

## To run all tests: 
```npm test```

The file `src/example/setup.js` runs before the tests,
it starts the server and initializes the db
and `src/example/teardown.js` is run after for teardown.

if `src/example/teardown.js` somehow does not run, you'll have to kill the dev server `node` process manually.

### To work on a single test file:

First run the development server:
```shell script
npm run start:watch
```
then seperately run the test file:
```shell script
node  --require=ts-node/register src/test/example/kamand.test.ts
```


#DB Migrations
we can use postgres-migrations for database migration