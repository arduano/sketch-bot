var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "express", "fs", "path", "axios"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var express = require("express");
    var fs = require("fs");
    var path = require("path");
    var axios = require("axios");
    var bodyParser = require('body-parser');
    var WebApi = /** @class */ (function () {
        function WebApi(discordBot) {
            this.redirect = 'https://sketch-bot.arduano.io/';
            this.discordApi = 'https://discordapp.com/api/v6/';
            this.discordBot = discordBot;
            this.express = express();
            this.express.use(bodyParser.json({
                limit: '5000mb'
            }));
            this.express.use(bodyParser.urlencoded({
                extended: true,
                limit: '5000mb',
                parameterLimit: 10000000000
            }));
            this.mountRoutes();
        }
        WebApi.prototype.serialize = function (obj) {
            var str = [];
            for (var p in obj)
                if (obj.hasOwnProperty(p)) {
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
                }
            return str.join("&");
        };
        WebApi.prototype.mountRoutes = function () {
            var _this = this;
            var router = express.Router();
            router.use(function (req, res, next) {
                res.header("Access-Control-Allow-Origin", "*");
                res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
                next();
            });
            router.get('/', function (req, res) {
                res.sendFile('index.html', { root: __dirname });
            });
            router.get('/api/get-token/:code', function (req, res) {
                var url = _this.discordApi + 'oauth2/token';
                var body = {
                    'code': req.params.code,
                    'client_id': '528166288527327262',
                    'client_secret': 'xRW5nL50MzCjngc9AGpozOiR8ZId9MJD',
                    'grant_type': 'authorization_code',
                    'redirect_uri': _this.redirect,
                    'scope': 'identify'
                };
                var options = _this.serialize(body);
                axios.default.post(url, options).then(function (r) {
                    res.status(200).json(r.data);
                }).catch(function (r) {
                    res.status(400).send(r.message);
                });
            });
            router.get('/api/refresh-token/:token', function (req, res) {
                var url = _this.discordApi + 'oauth2/token';
                var body = {
                    'code': req.params.token,
                    'client_id': '528166288527327262',
                    'client_secret': 'xRW5nL50MzCjngc9AGpozOiR8ZId9MJD',
                    'grant_type': 'refresh_token',
                    'redirect_uri': _this.redirect,
                    'scope': 'identify'
                };
                var options = _this.serialize(body);
                axios.default.post(url, options).then(function (r) {
                    res.status(200).json(r.data);
                }).catch(function (r) {
                    res.status(400).send(r.message);
                });
            });
            router.get('/api/get-img/:cid/:mid', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var img;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.discordBot.getImage(req.params.cid, req.params.mid)];
                        case 1:
                            img = _a.sent();
                            if (img == null) {
                                res.status(400).send("Image not found");
                            }
                            else
                                res.status(200).send(img);
                            return [2 /*return*/];
                    }
                });
            }); });
            router.get('/api/get-channel-data/:cid/:uid', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var data;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.discordBot.confirmChannel(req.params.cid, req.params.uid)];
                        case 1:
                            data = _a.sent();
                            if (typeof (data) == "string") {
                                res.status(400).send(data);
                                return [2 /*return*/];
                            }
                            res.json(data);
                            return [2 /*return*/];
                    }
                });
            }); });
            router.post('/api/post/:cid', function (req, res) { return __awaiter(_this, void 0, void 0, function () {
                var url, AuthStr;
                var _this = this;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            url = 'https://discordapp.com/api/v6/users/@me';
                            AuthStr = 'Bearer '.concat(req.body.user);
                            return [4 /*yield*/, axios.default.get(url, { headers: { Authorization: AuthStr } }).then(function (r) { return __awaiter(_this, void 0, void 0, function () {
                                    var status;
                                    return __generator(this, function (_a) {
                                        switch (_a.label) {
                                            case 0: return [4 /*yield*/, this.discordBot.sendImage(req.body.image, r.data.id, req.params.cid)];
                                            case 1:
                                                status = _a.sent();
                                                if (status == true)
                                                    res.status(200).send('Sent');
                                                else
                                                    res.status(400).send(status);
                                                return [2 /*return*/];
                                        }
                                    });
                                }); }).catch(function (r) {
                                    res.status(400).send(r.message);
                                })];
                        case 1:
                            _a.sent();
                            return [2 /*return*/];
                    }
                });
            }); });
            router.get('**', function (req, res) {
                if (fs.existsSync(path.join(__dirname, req.url))) {
                    res.sendFile(path.join(__dirname, req.url));
                }
                else {
                    res.sendFile('index.html', { root: __dirname });
                }
            });
            this.express.use('/', router);
        };
        return WebApi;
    }());
    exports.WebApi = WebApi;
});
