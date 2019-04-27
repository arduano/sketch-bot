const exec = require('child_process');
const join = require('async-child-process').join;

async function pRun(command) {
  let run = exec.exec(command);

  run.stdout.on('data', function (data) {
    process.stdout.write(data);
  });

  run.stderr.on('data', function (data) {
    process.stdout.write(data);
  });

  run.on('exit', function (code) {
    //console.log('child process exited with code ' + code.toString());
  });

  await join(run)
}

pRun('gulp deploy');