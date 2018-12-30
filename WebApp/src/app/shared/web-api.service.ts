import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebApiService {
  private redirect = 'https://sketch-bot.appspot.com/';
  private discordApi = 'https://discordapp.com/api/v6/';
  //private baseUrl = 'https://sketch-bot.appspot.com/';
  private baseUrl = 'http://localhost:8080/';

  constructor(private http: HttpClient) { }


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
    console.log('REQUESTING TOKEN');
    
    let url = this.baseUrl + 'api/get-token/' + code
    return this.http.get(url)
    .toPromise().then((a: any) => {
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

  getGuildChannel(gid: string, cid: string){
    return this.http.get(this.baseUrl+ 'api/get-channel-data/' + gid + '/' + cid).toPromise().catch(() => null)
  }
}
