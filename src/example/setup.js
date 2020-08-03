const {spawn} = require('child_process');
const fs = require('fs');

try {
  const child = spawn('node', ['-r', 'ts-node/register', 'src/example/index.ts', '--test'],
    {
      env: {...process.env, TS_NODE_FILES: "1"},
      cwd: process.cwd(),
      detached: true
    });

  child.stdout.setEncoding('utf8');

  child.stdout.on('data', (data) => {
    console.log(`${data}`);
    if (data.indexOf('Server listening at') !== -1) {
      process.exit(0);
    }
  });

  child.stderr.on('data', (data) => {
    console.log(`${data}`);
    if (data.indexOf('kamand listen on') !== -1) {
      process.exit(0);
    }
  });

  child.on('close', (code) => {
    console.log(`child process exited with code ${code}`);
  });

  console.log('before stdout check', child.pid);
  fs.writeFileSync('.nyc_output/test_data.info', `pid=${child.pid}`, (err)=>{
    if (err){
      console.log("error happened in test setup pid", err);
    }
  });
} catch (e) {
  console.log("spawn error", e);
}

