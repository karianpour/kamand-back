require('dotenv').config();

const Server = require('./src/server');

let server;
function main(){
    server = new Server(); 
    server.run();
}

main();