import {app} from './app';
function main (){
  app();
}

process.on('SIGINT', async function() {
  debug('stopping');
  try{
    await server.stop();
    process.exit(0);
  }catch(err){
    console.error(err);
    process.exit(1);
  }
});

debug(`starting...`);

main();