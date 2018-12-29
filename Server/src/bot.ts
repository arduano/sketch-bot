import { WebApi } from './webapi';
import * as Discord from 'discord.js';
import * as path from 'path';

export class DiscordBot {
    private client = new Discord.Client();
    public webapi: WebApi = new WebApi();
	public start(token: string, port: number): void {
        this.webapi.express.listen(port)
		console.log('Starting bot...');
		this.client.on('ready', () => {
			console.log('The bot is ready!');
			console.log('Starting server...');
			this.client.user.setGame('testing');
		});

		this.client.login(token);
	}
}