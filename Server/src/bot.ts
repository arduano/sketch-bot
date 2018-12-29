import { WebApi } from './webapi';
import * as Discord from 'discord.js';
import * as path from 'path';

export class DiscordBot {
    private client = new Discord.Client();
    public webapi: WebApi = new WebApi();
    public baseUrl = "";
	public start(token: string, baseUrl: string, port: number): void {
        this.baseUrl = baseUrl;
        this.webapi.express.listen(port)
		console.log('Starting bot...');
		this.client.on('ready', () => {
			console.log('The bot is ready!');
			console.log('Starting server...');
			this.client.user.setActivity('testing');
		});

        this.client.on('message', (message) => {
            if(message.content.startsWith('/sketch')){
                message.channel.send(baseUrl + "sketch/" + message.guild.id + '/' + message.channel.id);
            }
        })
		this.client.login(token);
	}
}