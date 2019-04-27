(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./bot", "fs"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var bot_1 = require("./bot");
    var fs = require("fs");
    var settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
    var bot = new bot_1.DiscordBot();
    bot.start(settings.token, settings.baseUrl, settings.port);
});
