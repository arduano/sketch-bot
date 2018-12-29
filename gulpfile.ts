const gulp = require('gulp');
const join = require('async-child-process').join;
const fs = require('fs');
const exec = require('child_process');

async function pRun(command: any) {
  let run = exec.exec(command);

  run.stdout.on('data', function (data: any) {
    console.log(data);
  });

  run.stderr.on('data', function (data: any) {
    console.log(data);
  });

  run.on('exit', function (code: any) {
    //console.log('child process exited with code ' + code.toString());
  });

  await join(run)
}

async function serverBuild(cb: any) {
  await pRun('cd Server && tsc')
  //await pRun('copy package.json www\\package.json')
  //await pRun('copy settings.json www\\settings.json')
  fs.unlinkSync('www\\package.json')
  fs.unlinkSync('www\\settings.json')
  fs.copyFileSync('package.json', 'www\\package.json', function (e: any) {
    console.log(e);
    throw e;
  })
  fs.copyFileSync('settings.json', 'www\\settings.json', function (e: any) {
    console.log(e);
    throw e;
  })
  await pRun('cd www && npm install')
}

async function serverStart(cb: any) {
  await pRun('cd www && npm start')
}

async function clientBuild(cb: any) {
  await pRun('cd WebApp && ng build --prod')
}

gulp.task('server-build', serverBuild);
gulp.task('server-start', serverStart)

gulp.task('server', async function (cb: any) {
  await serverBuild(cb)
  await serverStart(cb)
})

gulp.task('build', async function (cb: any) {
  await clientBuild(cb)
  await serverBuild(cb)
  await serverStart(cb)
})

gulp.task('ng', async function(cb: any){
  await pRun('cd WebApp && ng serve')
})