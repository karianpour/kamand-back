import {setup} from '../../example/setup';
import tap from 'tap';

tap.test('server is running', async t=>{
  const server = await setup();
  console.log("server is ", server.getHttpServer());
  t.equal(1, 1);
  server.stop();
});

