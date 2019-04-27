
npm install -g typescript @angular/cli
npm install
cd WebApp && npm install
cd Server && npm install
cd WebApp && ng build --prod
cd Server && tsc
yes | cp -rf package.json www/package.json
yes | cp -rf settings.json www/settings.json
yes | cp -rf app.yaml www/app.yaml
cd www && npm install