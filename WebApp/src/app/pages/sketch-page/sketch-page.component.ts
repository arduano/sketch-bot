import { WebApiService } from './../../shared/web-api.service';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-sketch-page',
  templateUrl: './sketch-page.component.html',
  styleUrls: ['./sketch-page.component.less']
})
export class SketchPageComponent implements OnInit {
  public user: any;
  private gid: string;
  private cid: string;
  public channelDetails: any = { "guildName": "", "guildIconUrl": "", "channelName": "" };

  public lastError = "";

  constructor(private webapi: WebApiService, private route: ActivatedRoute, private router: Router) { }

  getPfpUrl() {
    return 'https://cdn.discordapp.com/avatars/' + this.user.id + '/' + this.user.avatar + '.png'
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.gid = params['gid']
      this.cid = params['cid']
    })
    let token = this.webapi.getToken();
    if (token == null) {
      //this.sendToVerify()
    }
    this.getUser()
    this.getChannelData()
  }

  sendToVerify() {
    let state = this.gid + 'x' + this.cid;
    window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id=528166288527327262&redirect_uri=https%3A%2F%2Fsketch-bot.appspot.com%2F&response_type=code&scope=identify&state=' + state;
  }

  async getUser() {
    let token = this.webapi.getToken();
    let user = await this.webapi.getMe(token);
    this.user = user;
  }

  logOut() {
    this.webapi.deleteToken();
  }

  async getChannelData() {
    let channelDetails = await this.webapi.getGuildChannel(this.gid, this.cid);
    if (channelDetails != null) this.channelDetails = channelDetails;
    else this.lastError = "Couldn't find channel";
  }
}
