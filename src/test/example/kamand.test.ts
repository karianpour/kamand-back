import tap from 'tap';
import {v4 as uuidv4} from 'uuid';
import {config as readEnv} from 'dotenv';
import axios from 'axios';

readEnv();
const SERVER_HOST = process.env.SERVER_HOST;
const SERVER_PORT = process.env.SERVER_PORT;
const SERVER_ADDRESS = `http://${SERVER_HOST}:${SERVER_PORT}`;
axios.defaults.baseURL = `${SERVER_ADDRESS}`;
axios.defaults.validateStatus = () => {
  return true;
};

const code = Math.floor(Math.random() * 10000) + 1;
const TEST_DATA = {
  acc: {
    id: uuidv4(),
    parentId: uuidv4(),
    code,
    name: "Pouria" + code,
    level: 2,
    leaf: false,
    createdAt: new Date()
  },
  auth: {
    mobileNumber: '09121161998',
    password: '123456'
  }
}


tap.test("Test Acc-Repository", async t => {
  let token;
  t.test('User can login', async t => {
    const response = await axios.request({
      url: `/users/login`,
      method: "post",
      data: TEST_DATA.auth,
    });
    t.equal(response.status, 200, "respone ok");
    token = response.data.token;
    if (!token) {
      t.fail("no token")
    }
  });


  t.test('Create an Acc', async t => {
    const response = await axios.request({
      url: `/acc/${TEST_DATA.acc.id}`,
      method: "post",
      headers: {'Authorization': `Bearer ${token}`},
      data: TEST_DATA.acc,
    });
    response.data.createdAt = new Date(response.data.createdAt);
    t.same(response.data, TEST_DATA.acc, "response Same Acc");
    t.equal(response.status, 200, "respone ok");
  });


  t.test('Get an Acc', async t => {
    const response = await axios.request({
      url: `/acc/${TEST_DATA.acc.id}`,
      method: "get",
      headers: {'Authorization': `Bearer ${token}`},
    });
    t.equal(response.status, 200, "response ok");
    t.same(response.data, {id: TEST_DATA.acc.id, name: TEST_DATA.acc.name}, "response Same Acc");
  });

  t.test('Get an Acc from sample data', async t => {
    const response = await axios.request({
      url: `/acc/937c662e-0f07-4a91-a407-bae9e98639f1`,
      method: "get",
      headers: {'Authorization': `Bearer ${token}`},
    });
    t.equal(response.status, 200, "response ok");
    t.same(response.data, {id: '937c662e-0f07-4a91-a407-bae9e98639f1', name: 'دارایی'});
  });
});

