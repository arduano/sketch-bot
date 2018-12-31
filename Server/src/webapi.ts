import * as express from 'express'
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { Observable } from 'rxjs';
import { DiscordBot } from './bot';
import * as axios from 'axios';
const bodyParser = require('body-parser');

export class WebApi {
    public express: express.Express;

    public discordBot: DiscordBot;
    private redirect = 'https://sketch-bot.appspot.com/';
    private discordApi = 'https://discordapp.com/api/v6/';

    serialize(obj) {
        var str = [];
        for (var p in obj)
            if (obj.hasOwnProperty(p)) {
                str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
            }
        return str.join("&");
    }

    constructor(discordBot: DiscordBot) {
        this.discordBot = discordBot;
        this.express = express()
        this.express.use(bodyParser.json({
            limit: '5000mb'
        }));
        this.express.use(bodyParser.urlencoded({
            extended: true,
            limit: '5000mb',
            parameterLimit: 10000000000
        }));
        this.mountRoutes()
    }

    private mountRoutes(): void {
        const router = express.Router()

        router.use(function (req, res, next) {
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
        router.get('/api/get-token/:code', (req, res) => {
            let url: any = this.discordApi + 'oauth2/token'
            let body = {
                'code': req.params.code,
                'client_id': '528166288527327262',
                'client_secret': 'xRW5nL50MzCjngc9AGpozOiR8ZId9MJD',
                'grant_type': 'authorization_code',
                'redirect_uri': this.redirect,
                'scope': 'identify'
            }
            let options: any = this.serialize(body)
            axios.default.post(url, options).then(r => {
                res.status(200).json(r.data)
            }).catch(r => {
                res.status(400).send(r.message)
            })
        })
        router.get('/api/get-channel-data/:gid/:cid/:uid', async (req, res) => {
            let data = await this.discordBot.confirmChannel(req.params.gid, req.params.cid, req.params.uid)
            if (typeof (data) == "string") {
                res.status(400).send(data)
                return;
            }
            res.json(data);
        })
        router.post('/api/post/:gid/:cid', async (req, res) => {
            let status = await this.discordBot.sendImage(req.body.image, req.body.user, req.params.gid, req.params.cid)
            if (status == true) res.status(200).send('Sent');
            else res.status(400).send(status);
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