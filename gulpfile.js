const gulp = require('gulp');
const join = require('async-child-process').join;
const fs = require('fs');
const exec = require('child_process');

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

async function serverBuild(cb) {
  await pRun('cd Server && tsc')
  try{
    fs.unlinkSync('www/package.json')
    fs.unlinkSync('www/settings.json')
    fs.unlinkSync('www/app.yaml')
  }
  catch(e){}
  fs.copyFileSync('package.json', 'www/package.json', function (e) {
    console.log(e);
    throw e;
  })
  fs.copyFileSync('settings.json', 'www/settings.json', function (e) {
    console.log(e);
    throw e;
  })
  fs.copyFileSync('app.yaml', 'www/app.yaml', function (e) {
    console.log(e);
    throw e;
  })
  await pRun('cd www && npm install')
}

async function serverStart(cb) {
  await pRun('cd www && node server.js')
}

async function clientBuild(cb) {
  await pRun('cd WebApp && ng build --prod')
}

gulp.task('server-build', serverBuild);
gulp.task('server-start', serverStart)

gulp.task('server', async function (cb) {
  await serverBuild(cb)
  await serverStart(cb)
})

gulp.task('build', async function (cb) {
  await clientBuild(cb)
  await serverBuild(cb)
})

gulp.task('build-run', async function (cb) {
  await clientBuild(cb)
  await serverBuild(cb)
  await serverStart(cb)
})

gulp.task('ng', async function(cb){
  await pRun('cd WebApp && ng serve')
})

async function install(){
  await pRun('npm install -g typescript @angular/cli')
  await pRun('npm install')
  await pRun('cd WebApp && npm install')
  await pRun('cd Server && npm install')
}

gulp.task('install', async function(cb){
  await install()
})

gulp.task('replace', async function(cb){
  await pRun('python replace_localhost.py')
})

gulp.task('deploy', async function(cb){
  await install()
  await clientBuild(cb)
  await serverBuild(cb)
  await pRun('python replace_localhost.py')
  await pRun('cd www && gcloud app deploy -q')
})