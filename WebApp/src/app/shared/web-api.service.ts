import { environment } from './../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebApiService {
  //private baseUrl = 'https://sketch-bot.appspot.com/';
  private baseUrl = environment.production ? 'http://sketch-bot.arduano.io/' : 'http://localhost:8080/';

  constructor(private http: HttpClient) { }


  getToken() {
    return localStorage.getItem('access_token')
  }

  deleteToken() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('expires_in')
    localStorage.removeItem('refresh_token')
  }

  requestToken(code: string) {
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

  async refreshToken() {
    let url = this.baseUrl + 'api/refresh-token/' + localStorage.getItem('refresh_token')
    return await this.http.get(url)
      .toPromise().then((a: any) => {
        localStorage.setItem('access_token', a.access_token)
        localStorage.setItem('expires_in', a.expires_in)
        localStorage.setItem('refresh_token', a.refresh_token)
        return a;
      })
  }



  getMe(token: string) {
    return this.http.get('https://discordapp.com/api/v6/users/@me', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }).toPromise()
  }

  getGuildChannel(cid: string, uid: string) {
    return this.http.get(this.baseUrl + 'api/get-channel-data/' + cid + '/' + uid).toPromise()
  }

  async postImage(data, uid, cid: string) {
    let url = this.baseUrl + 'api/post/' + cid
    return await this.http.post(url, { image: data, user: this.getToken() }).toPromise()
      .then(() => true)
      .catch(() => false)
  }

  getImage(cid: string, mid: string){
    let url = this.baseUrl + 'api/get-img/' + cid + '/' + mid
    return this.http.get(url).toPromise()
  }
}
