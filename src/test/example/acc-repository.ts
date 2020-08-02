import {setup} from '../../example/setup';
import tap from 'tap';
import * as supertest from 'supertest';

const ACC_ID1 = 123;

tap.test('acc-repository server', async t => {
  const server = await setup();
  const fastify = server.getHttpServer().getFastifyServer();
  t.tearDown(() => {
    server.stop()
  })

  await fastify.ready();

  t.test('Get an Account', async t => {

    const response = supertest(fastify.server)
      .get(`/acc/${ACC_ID1}`)
      .expect(405)
      .expect('Content-Type', 'application/json; charset=utf-8');
    console.log("response is", response.body);
  });

  t.equal(1, 1);
});


