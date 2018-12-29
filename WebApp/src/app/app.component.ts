import { Component, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.less']
})
export class AppComponent {
  lastResponse = "";
  text: string = "";
  @ViewChild('asdf') asdf: ElementRef;
  constructor(private http: HttpClient){

  }
  send(){
    this.http.get('/api/' + this.asdf.nativeElement.value).subscribe((r: any) => {
      this.lastResponse = r.id
    })
  }
}
