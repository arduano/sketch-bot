import * as express from 'express'
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { Observable } from 'rxjs';

export class WebApi {
    public express: express.Express;

    constructor() {
        this.express = express()
        this.mountRoutes()
    }

    private mountRoutes(): void {
        const router = express.Router()

        router.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*");
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
            next();
        });

        router.get('/', (req, res) => {
            res.sendFile('index.html', { root: __dirname })
        })
        router.get('/api/:id', (req, res) => {
            res.json({ id: req.params.id });
        })
        router.get('**', (req, res) => {
            if (fs.existsSync(path.join(__dirname, req.url))) {
                res.sendFile(path.join(__dirname, req.url))
            }
            else {
                res.sendFile('index.html', { root: __dirname })
            }
        })
        this.express.use('/', router)
        
    }
}