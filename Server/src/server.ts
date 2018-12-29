import { WebApi } from './webapi';
import { DiscordBot } from './bot';
import * as fs from 'fs';

const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

const bot = new DiscordBot();
bot.start(settings.token, settings.port);
