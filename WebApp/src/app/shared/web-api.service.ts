import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebApiService {
  private redirect = 'https://sketch-bot.appspot.com/';
  private discordApi = 'https://discordapp.com/api/v6/';

  constructor(private http: HttpClient) { }

  serialize(obj) {
    var str = [];
    for (var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
    return str.join("&");
  }

  getToken() {
    return localStorage.getItem('access_token')
  }

  deleteToken() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('expires_in')
    localStorage.removeItem('refresh_token')
  }

  refreshToken(){

  }

  requestToken(code: string) {
    let url = this.discordApi + 'oauth2/token'
    let body = {
      'code': code,
      'client_id': '528166288527327262',
      'client_secret': 'xRW5nL50MzCjngc9AGpozOiR8ZId9MJD',
      'grant_type': 'authorization_code',
      'redirect_uri': this.redirect,
      'scope': 'identify'
    }
    return this.http.post(url, this.serialize(body), {
      headers: new HttpHeaders()
        .set('Content-Type', 'application/x-www-form-urlencoded'),
    }).toPromise().then((a: any) => {
      localStorage.setItem('access_token', a.access_token)
      localStorage.setItem('expires_in', a.expires_in)
      localStorage.setItem('refresh_token', a.refresh_token)
      console.log(a);
      return a;
    })
  }

  getMe(token: string) {
    return this.http.get('https://discordapp.com/api/v6/users/@me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }).toPromise().catch(() => null)
  }
}
