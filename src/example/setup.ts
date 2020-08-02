import {App} from './app';

export async function setup() {
  const app = new App();
  await app.init();
  return app;
}

