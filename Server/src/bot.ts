import { WebApi } from './webapi';
import * as Discord from 'discord.js';
import * as path from 'path';
import { Stream, Readable } from 'stream';

export class DiscordBot {
    private client = new Discord.Client();
    public webapi: WebApi;
    public baseUrl = "";
    public started = false;

    constructor() {
        this.webapi = new WebApi(this);
    }

    public start(token: string, baseUrl: string, port: number): void {
        this.baseUrl = baseUrl;

        this.webapi.discordBot = this;
        this.webapi.express.listen(port)

        console.log('Starting bot...');
        this.client.on('ready', () => {
            console.log('The bot is ready!');
            console.log('Starting server...');
            this.client.user.setActivity('testing');
            this.started = true;
        });

        this.client.on('message', (message) => {
            if (message.content.startsWith('/sketch')) {
                message.channel.send(baseUrl + "sketch/" + message.guild.id + '/' + message.channel.id);
            }
        })
        this.client.login(token);
    }

    public confirmChannel(gid: string, cid: string) {
        let data: any = {};
        let guild = this.client.guilds.get(gid);
        if (guild == null) { return null; }
        let channel = guild.channels.get(cid);
        if (channel == null) { return null; }
        data.guildName = guild.name;
        data.guildIconUrl = guild.iconURL;
        data.channelName = channel.name;
        return data;
    }

    public async sendImage(data, uid, gid, cid) {
        let guild = this.client.guilds.get(gid);
        if (guild == null) { return null; }
        let channel = guild.channels.get(cid) as Discord.TextChannel;
        if (channel == null) { return null; }
        let user = await this.client.fetchUser(uid);
        if (channel == null) { return null; }
        let buffer = Buffer.from(data.replace("data:image/png;base64,", ""), "base64");
        channel.send(user.username + '#' + user.discriminator + ' drew:',
            new Discord.Attachment(buffer, 'image.png')
        );
    }
}