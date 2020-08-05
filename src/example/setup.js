const {spawn} = require('child_process');
const fs = require('fs');
const {Client} = require('pg');
const readEnv = require('dotenv').config;

try {
    fs.accessSync('.env.test');
    readEnv({path: '.env.test'});
} catch (e) {
    console.log(`Tests need the .env.test file.`,e);
    process.exit(1);
}

const DB_SAMPLE = 'src/example/db/database.sql';
const DB_DATABASE = process.env.DB_DATABASE;

async function runDB(query, initialDB = false) {
    if (initialDB && !process.env.DB_INITIAL_DB) {
        throw ("Need DB_INITIAL_DB to create test database");
    }
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

async function initDb() {
    try {
        await runDB(`drop database if exists ${DB_DATABASE}`, true);
        await runDB(`create database ${DB_DATABASE} encoding = 'utf8' 
        lc_collate = 'fa_IR.utf8' template template0`, true);
        const sql = fs.readFileSync(DB_SAMPLE).toString();
        await runDB(sql);
    } catch (e) {
        console.log("error in init-db", e);
        process.exit(1);
    }
}

function setupServer() {
    try {
        const child = spawn('node', ['-r', 'ts-node/register', 'src/example/index.ts', '--test'],
            {
                env: {...process.env, TS_NODE_FILES: "1"},
                cwd: process.cwd(),
                detached: true
            });

        child.stdout.setEncoding('utf8');

        child.stdout.on('data', (data) => {
            console.log(`${data}`.trim());
            if (data.indexOf('Server listening at') !== -1) {
                process.exit(0);
            }
        });

        child.stderr.on('data', (data) => {
            console.log(`${data}`.trim());
            if (data.indexOf('kamand listen on') !== -1) {
                process.exit(0);
            }
        });

        child.on('close', (code) => {
            console.log(`child process exited with code ${code}`);
        });

        console.log('before stdout check', child.pid);
        fs.writeFileSync('.nyc_output/test_data.info', `pid=${child.pid}`, (err) => {
            if (err) {
                console.log("error happened in test setup pid", err);
            }
        });

    } catch (e) {
        console.log("spawn error", e);
    }
}


async function setup() {
    await initDb();
    setupServer();
}

setup();