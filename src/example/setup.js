const {spawn} = require('child_process');
const fs = require('fs');

try {
  console.log('before spawn');
  const child = spawn('node', ['-r', 'ts-node/register', 'src/example/index.ts'],
    {
      env: {...process.env, TS_NODE_FILES: "1"},
      cwd: "/home/pouria/code/zarin/kamand-back",
      detached: true
    });

  child.stdout.setEncoding('utf8');


  console.log('before stdout check', child.pid);
  fs.writeFileSync('.nyc_output/test_data.info', `pid=${child.pid}`, (err)=>{
    if (err){
      console.log("error happened in test setup pid", err);
    }
  });

  child.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
    if (data.indexOf('Server listening at') !== -1) {
      process.exit(0);
    }
  });

  child.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
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

