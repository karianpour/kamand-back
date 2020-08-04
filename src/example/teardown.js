fs = require('fs')
const {Client} = require('pg');
const readEnv = require('dotenv').config;

const TEST_DATA_PATH = '.nyc_output/test_data.info';

try {
    fs.accessSync('.env.test');
    readEnv({path: '.env.test'});
} catch (e) {
    console.log(`Tests need the .env.test file.`, e);
}

const DB_DATABASE = process.env.DB_DATABASE;

async function runDB(query, initialDB = false) {
    const client = new Client({
        user: process.env.DB_USER,
        host: process.env.DB_HOST,
        database: initialDB ? process.env.DB_INITIAL_DB : process.env.DB_DATABASE,
        password: process.env.DB_PASS,
        port: process.env.DB_PORT
    });
    await client.connect();
    await client.query(query);
    await client.end();
}

async function dropDb() {
    try {
        await runDB(`drop database if exists ${DB_DATABASE}`, true);
    } catch (e) {
        console.log("error in drop-db", e);
    }
}

async function shutdownServer() {
    try {
        if (fs.existsSync(TEST_DATA_PATH)) {
            const data = fs.readFileSync(TEST_DATA_PATH, 'utf8');
            const lines = data.split('\n');
            for (const line of lines) {
                if (line.indexOf("pid=") !== -1) {
                    const pid = line.split('=')[1];
                    console.log("Killing the Server with pid:", pid);
                    process.kill(pid);
                    fs.unlinkSync(TEST_DATA_PATH);
                }
            }
        }
    } catch (e) {
        console.log("error happened in reading file", e);
    }
}


async function teardown() {
    await shutdownServer();
    await dropDb();
}

teardown();