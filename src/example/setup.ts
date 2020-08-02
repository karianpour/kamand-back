import {app} from './app';

import * as Debug from "debug";

let debug = Debug('kamand-example');

export async function setup() {
  return await app({noNetwork: true});
}

