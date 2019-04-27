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
        define(["require", "exports", "./webapi", "discord.js"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var webapi_1 = require("./webapi");
    var Discord = require("discord.js");
    var DiscordBot = /** @class */ (function () {
        function DiscordBot() {
            this.client = new Discord.Client();
            this.baseUrl = "";
            this.started = false;
            this.webapi = new webapi_1.WebApi(this);
        }
        DiscordBot.prototype.start = function (token, baseUrl, port) {
            var _this = this;
            this.baseUrl = baseUrl;
            this.webapi.discordBot = this;
            this.webapi.express.listen(port);
            console.log('Starting bot...');
            this.client.on('ready', function () {
                console.log('The bot is ready!');
                console.log('Starting server...');
                _this.client.user.setActivity('/sketch');
                _this.started = true;
                var guilds = _this.client.guilds.array().map(function (s) { return s.name; });
                console.log('Guilds:');
                for (var s in guilds) {
                    console.log(guilds[s]);
                }
            });
            this.client.on('message', function (message) {
                if (baseUrl.includes('localhost')) {
                    try {
                        if (message.member.user.id != '242516597170765824' &&
                            message.member.user.id != '428251537312317441')
                            return;
                    }
                    catch (_a) { }
                }
                if (message.content.startsWith('/sketch')) {
                    var id = message.content.substring(8);
                    if (id.length > 0 && message.content.startsWith('/sketch ')) {
                        var img = _this.getImage(message.channel.id, message.id);
                        if (img == null) {
                            message.channel.send("Image not found (has to be in the same channel, sent by the bot)");
                        }
                        else {
                            message.channel.send(baseUrl + 'sketch/' + message.channel.id + '/' + id);
                        }
                    }
                    else
                        message.channel.send(baseUrl + 'sketch/' + message.channel.id);
                }
                if (message.content.startsWith('<@528166288527327262>')) {
                    message.channel.send('ok');
                }
            });
            this.client.login(token);
        };
        DiscordBot.prototype.confirmChannel = function (cid, uid) {
            return __awaiter(this, void 0, void 0, function () {
                var data, channel, guild, user, member, _a, self;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            data = {};
                            channel = this.client.channels.get(cid);
                            if (channel == null) {
                                return [2 /*return*/, 'Invalid channel'];
                            }
                            guild = channel.guild;
                            return [4 /*yield*/, this.client.fetchUser(uid)];
                        case 1:
                            user = _b.sent();
                            if (user == null) {
                                return [2 /*return*/, 'Invalid user'];
                            }
                            _b.label = 2;
                        case 2:
                            _b.trys.push([2, 4, , 5]);
                            return [4 /*yield*/, guild.fetchMember(user)];
                        case 3:
                            member = _b.sent();
                            return [3 /*break*/, 5];
                        case 4:
                            _a = _b.sent();
                            return [2 /*return*/, 'User not in Server'];
                        case 5:
                            if (!(channel.memberPermissions(member).has(Discord.Permissions.FLAGS.VIEW_CHANNEL) &&
                                channel.memberPermissions(member).has(Discord.Permissions.FLAGS.SEND_MESSAGES) &&
                                channel.memberPermissions(member).has(Discord.Permissions.FLAGS.ATTACH_FILES) ||
                                channel.memberPermissions(member).has(Discord.Permissions.FLAGS.ADMINISTRATOR))) {
                                return [2 /*return*/, 'Invalid user permissions for the channel'];
                            }
                            return [4 /*yield*/, guild.fetchMember(this.client.user)];
                        case 6:
                            self = _b.sent();
                            if (!(channel.memberPermissions(self).has(Discord.Permissions.FLAGS.VIEW_CHANNEL) &&
                                channel.memberPermissions(self).has(Discord.Permissions.FLAGS.SEND_MESSAGES) &&
                                channel.memberPermissions(self).has(Discord.Permissions.FLAGS.ATTACH_FILES) ||
                                channel.memberPermissions(self).has(Discord.Permissions.FLAGS.ADMINISTRATOR))) {
                                return [2 /*return*/, 'Invalid bot permissions for the channel'];
                            }
                            data.guildName = guild.name;
                            data.guildIconUrl = guild.iconURL;
                            data.channelName = channel.name;
                            return [2 /*return*/, data];
                    }
                });
            });
        };
        DiscordBot.prototype.sendImage = function (data, uid, cid) {
            return __awaiter(this, void 0, void 0, function () {
                var c, channel, guild, user, buffer;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, this.confirmChannel(cid, uid)];
                        case 1:
                            c = _a.sent();
                            if (typeof (c) == "string")
                                return [2 /*return*/, c];
                            channel = this.client.channels.get(cid);
                            if (channel == null) {
                                return [2 /*return*/, null];
                            }
                            guild = channel.guild;
                            return [4 /*yield*/, this.client.fetchUser(uid)];
                        case 2:
                            user = _a.sent();
                            if (channel == null) {
                                return [2 /*return*/, null];
                            }
                            buffer = Buffer.from(data.replace("data:image/png;base64,", ""), "base64");
                            channel.send(user.username + '#' + user.discriminator + ' drew:', new Discord.Attachment(buffer, 'image.png'));
                            return [2 /*return*/, true];
                    }
                });
            });
        };
        DiscordBot.prototype.getImage = function (cid, mid) {
            return __awaiter(this, void 0, void 0, function () {
                var channel, message, _a, att;
                return __generator(this, function (_b) {
                    switch (_b.label) {
                        case 0:
                            channel = this.client.channels.get(cid);
                            if (channel == null) {
                                return [2 /*return*/, null];
                            }
                            _b.label = 1;
                        case 1:
                            _b.trys.push([1, 3, , 4]);
                            return [4 /*yield*/, channel.fetchMessage(mid)];
                        case 2:
                            message = _b.sent();
                            return [3 /*break*/, 4];
                        case 3:
                            _a = _b.sent();
                            return [2 /*return*/, null];
                        case 4:
                            if (message.member.user.id != '528166288527327262')
                                return [2 /*return*/, null];
                            att = message.attachments.array()[0];
                            if (att == null) {
                                return [2 /*return*/, null];
                            }
                            if (att.width == null || att.height == null) {
                                return [2 /*return*/, null];
                            }
                            return [2 /*return*/, { width: att.width, height: att.height, url: att.proxyURL }];
                    }
                });
            });
        };
        return DiscordBot;
    }());
    exports.DiscordBot = DiscordBot;
});
