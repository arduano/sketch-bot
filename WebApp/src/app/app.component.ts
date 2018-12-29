import { Component, ViewChild, ElementRef } from '@angular/core';
import { WebApiService } from './shared/web-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { stringify } from '@angular/core/src/util';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  constructor(private webapi: WebApiService, private route: ActivatedRoute, private router: Router) {
    this.route.queryParams.subscribe(async (params) => {
      let code = params['code']
      let state: string = params['state']
      if (code != null) {
        let response = await this.webapi.requestToken(code);
        console.log(response);
        let ids = state.split('x');
        this.router.navigate(['sketch/' + ids[0] + '/' + ids[1]]);
      }
    })
  }
}
