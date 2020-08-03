const {spawn} = require('child_process');
const fs = require('fs');

try {
  console.log('Test Setup: running server');
  const child = spawn('node', ['-r', 'ts-node/register', 'src/example/index.ts'],
    {
      env: {...process.env, TS_NODE_FILES: "1"},
      cwd: '/home/pouria/code/kamand/kamand-back',
      detached: true
    });

  child.stdout.setEncoding('utf8');


  console.log('Server pid:', child.pid);
  fs.writeFileSync('.nyc_output/test_data.info', `pid=${child.pid}`, (err)=>{
    if (err){
      console.log("Error happened in test setup pid", err);
    }
  });

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

} catch (e) {
  console.log("spawn error", e);
}

