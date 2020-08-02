import { config as readEnv } from 'dotenv';
readEnv();
import {App} from '../lib/app';

export async function setup() {
  const app = new App();
  await app.init(__dirname);
  return app;
}