const gulp = require('gulp');
const fs = require('fs');
const exec = require('child_process');

function join(child) {
  return new Promise((_resolve, _reject) => {
    function resolve(result) {
      child.removeAllListeners()
      _resolve(result)
    }
    function reject(error) {
      child.removeAllListeners()
      _reject(error)
    }
    child.on('exit', (code, signal) => {
      if (code != null && code !== 0) {
        const error = new Error(`process exited with code ${code}`)
        const flowWorkaround = error
        flowWorkaround.code = code
        flowWorkaround.signal = null
        reject(error)
      }
      else if (signal) {
        const error = new Error(`process exited with signal ${signal}`)
        const flowWorkaround = error
        flowWorkaround.code = null
        flowWorkaround.signal = signal
        reject(error)
      }
      else resolve({code, signal})
    })
    child.on('error', reject)
  })
}

async function pushAll(){
  await pRun('git add .')
  await pRun('git commit -m \"deploy\"')
  await pRun('git push')
}

async function fullBuild(cb){
  await install()
  await clientBuild(cb)
  await serverBuild(cb)
  await pRun('python replace_localhost.py')
}

async function start(){
  await pRun('cd www && npm start')
}

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
  await fullBuild(cb)
  //await pushAll();
})

gulp.task('prod', async function(cb){
  await fullBuild(cb)
  while(true){
    await start();
  }
})