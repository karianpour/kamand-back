const fs = require('fs')

const test_data_path = '.nyc_output/test_data.info';

try {
    if (fs.existsSync(test_data_path)) {
        const data = fs.readFileSync(test_data_path, 'utf8');
        const lines = data.split('\n');
        for (const line of lines) {
            if (line.indexOf("pid=") !== -1) {
                const pid = line.split('=')[1];
                console.log("killing the process with pid:", pid);
                process.kill(pid);
                fs.unlinkSync(test_data_path);
            }
        }
    }
} catch (e) {
    console.log("error happened in reading file", e);
}


//TODO: drop db


