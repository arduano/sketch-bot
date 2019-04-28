(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./bot"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var bot_1 = require("./bot");
    //const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));
    var settings = {
        "port": process.env.PORT,
        "token": process.env.TOKEN,
        "baseUrl": process.env.URL
    };
    var bot = new bot_1.DiscordBot();
    bot.start(settings.token, settings.baseUrl, settings.port);
});
