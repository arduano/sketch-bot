import { element } from 'protractor';
import { WebApiService } from './../../shared/web-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise, take, buffer, max } from 'rxjs/operators';
import resizeCanvas from 'resize-canvas'
import { paletteTransition } from './sketch-page.animations';
declare var require: any;
const Beizer = require('bezier-js')

@Component({
  selector: 'app-sketch-page',
  templateUrl: './sketch-page.component.html',
  styleUrls: ['./sketch-page.component.less'],
  animations: [
    paletteTransition
  ]
})
export class SketchPageComponent implements OnInit {
  @ViewChild('canvas') public canvas: ElementRef;
  @ViewChild('server_section') public server_section: ElementRef;
  @ViewChild('user_section') public user_section: ElementRef;
  @ViewChild('header') public header: ElementRef;
  @ViewChild('resize_head') public resize_head: ElementRef;
  @ViewChild('brush_size_draggable') public brush_size_draggable: ElementRef;

  @Input() public width = 600;
  @Input() public height = 400;

  public headerWrapped = false;
  checkWrapped() {
    this.headerWrapped = this.user_section.nativeElement.clientWidth + this.server_section.nativeElement.clientWidth >= this.header.nativeElement.clientWidth
  }

  public colors: string[] = [
    '#67717a',
    '#000000',
    '#FFFFFF',
    '#FF0000',
    '#800000',
    '#FFFF00',
    '#808000',
    '#00FF00',
    '#008000',
    '#00FFFF',
    '#008080',
    '#0000FF',
    '#000080',
    '#FF00FF',
    '#800080',
  ]
  public paletteShown = false;

  public sizes: number[] = [
    1, 3, 5, 10, 20, 30, 40
  ]
  public sizesShown = false;

  private prevEvents: { x: number, y: number }[] = [];

  public resizeDragStartPos;
  public resizeDragCanvasStartSize;

  private cx: CanvasRenderingContext2D;

  public user: any = { username: "" };
  private gid: string;
  private cid: string;
  public channelDetails: any = { "guildName": "", "guildIconUrl": "", "channelName": "" };

  public lastError = "";

  public pfpUrl = "";
  public username = "";


  constructor(private webapi: WebApiService, private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.gid = params['gid']
      this.cid = params['cid']
    })
    let token = this.webapi.getToken();
    if (token == null) {
      this.sendToVerify()
    }
    this.getUser().then(() =>
      this.getChannelData().catch(e => {
        this.lastError = e.error;
        if (e.status == 0) {
          this.lastError = "Connection error";
        }
      })
    ).catch(() => null)

    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    canvasEl.width = this.width;
    canvasEl.height = this.height;
    {
      var move = (res: MouseEvent | TouchEvent, state: { startPos: { x: number, y: number }, startVal: any }) => {
        res.preventDefault();
        let drag = [0, 0];
        if (res instanceof TouchEvent) {
          drag[0] = res.touches[0].clientX;
          drag[1] = res.touches[0].clientY;
        }
        else {
          drag[0] = res.clientX;
          drag[1] = res.clientY;
        }
        drag = [drag[0] - state.startPos.x, drag[1] - state.startPos.y];
        let size = [state.startVal.x + drag[0] * 2, state.startVal.y + drag[1] * 2]
        this.fixCanvasWidth(size)
      }

      let start = (res: MouseEvent | TouchEvent) => {
        let state = { startPos: { x: 0, y: 0 }, startVal: { x: 0, y: 0 } }
        if (res instanceof TouchEvent) {
          state.startPos.x = res.touches[0].clientX
          state.startPos.y = res.touches[0].clientY
        }
        else {
          state.startPos.x = res.clientX
          state.startPos.y = res.clientY
        }
        state.startVal.x = this.canvas.nativeElement.width
        state.startVal.y = this.canvas.nativeElement.height
        return state
      }

      let resizeDraggable = new Draggable(this.resize_head, start, move, () => null)
    }
    // {
    //   var move = (res: MouseEvent | TouchEvent, state: { startPos: { x: number, y: number }, startVal: any }) => {
    //     res.preventDefault();
    //     let drag = [0, 0];
    //     if (res instanceof TouchEvent) {
    //       drag[0] = res.touches[0].clientX;
    //       drag[1] = res.touches[0].clientY;
    //     }
    //     else {
    //       drag[0] = res.clientX;
    //       drag[1] = res.clientY;
    //     }
    //     this.setMinWidth()
    //     drag = [drag[0] - state.startPos.x, drag[1] - state.startPos.y];
    //     let size = state.startVal + drag[0];
    //     this.canvasStroke.lineWidth = size;
    //   }

    //   let start = (res: MouseEvent | TouchEvent) => {
    //     let state = { startPos: { x: 0, y: 0 }, startVal: 0 }
    //     if (res instanceof TouchEvent) {
    //       state.startPos.x = res.touches[0].clientX
    //       state.startPos.y = res.touches[0].clientY
    //     }
    //     else {
    //       state.startPos.x = res.clientX
    //       state.startPos.y = res.clientY
    //     }
    //     state.startVal = this.canvasStroke.lineWidth;
    //     return state
    //   }

    //   let brushSizeDraggable = new Draggable(this.brush_size_draggable, start, move, () => null)
    // }

    this.captureCanvasEvents(canvasEl);
    this.fixCanvasWidth(null)
    this.fixCanvasStroke()
  }

  public minWidth = 0;
  setMinWidth() {
    this.minWidth = Math.max(this.user_section.nativeElement.clientWidth, this.server_section.nativeElement.clientWidth)
  }

  fixCanvasWidth(size = null) {
    this.setMinWidth()
    if (size == null) size = [this.canvas.nativeElement.width, this.canvas.nativeElement.height]
    if (size[0] < this.minWidth) size[0] = this.minWidth;
    if (size[1] < 100) size[1] = 100;
    if (size[0] > window.innerWidth - 50) size[0] = window.innerWidth - 50;
    if (size[1] > window.innerHeight - 200) size[1] = window.innerHeight - 200;
    size[0] = size[0] - size[0] % 2;
    size[1] = size[1] - size[1] % 2;
    resizeCanvas({
      canvas: this.canvas.nativeElement,
      diff: [size[0] - this.canvas.nativeElement.width, size[1] - this.canvas.nativeElement.height],
      from: [this.canvas.nativeElement.width / 2, this.canvas.nativeElement.height / 2]
    })
    this.checkWrapped()
    this.fixCanvasStroke()
  }

  public canvasStroke = { lineWidth: 3, lineCap: 'round', strokeStyle: '#67717a' }
  fixCanvasStroke() {
    this.cx.lineWidth = this.canvasStroke.lineWidth;
    this.cx.lineCap = this.canvasStroke.lineCap as CanvasLineCap;
    this.cx.strokeStyle = this.canvasStroke.strokeStyle;
  }

  changeColor(c) {
    this.canvasStroke.strokeStyle = c;
    this.fixCanvasStroke()
  }
  changeSize(s) {
    this.canvasStroke.lineWidth = s;
    this.fixCanvasStroke()
  }

  captureCanvasEvents(canvasEl: HTMLCanvasElement) {
    var move = (res: MouseEvent | TouchEvent) => {
      res.preventDefault();
      let pos = { x: 0, y: 0 };
      if (res instanceof TouchEvent) {
        pos.x = res.touches[0].clientX;
        pos.y = res.touches[0].clientY;
      }
      else {
        pos.x = res.clientX;
        pos.y = res.clientY;
      }
      const rect = canvasEl.getBoundingClientRect();

      this.prevEvents.push(pos)
      if (this.prevEvents.length > 2) {
        if (this.prevEvents.length > 3) this.prevEvents.splice(0, 1)

        let pos = this.prevEvents.map(e => {
          return {
            x: e.x - rect.left,
            y: e.y - rect.top
          }
        })

        let beizer = Beizer.quadraticFromPoints(
          pos[0],
          pos[1],
          pos[2],
          0.5
        ).split(0.5, 1)


        let len = beizer.length();
        if (len > 20) len /= 3;
        if (len < 2) len = 2;
        let lot: [] = beizer.getLUT(Math.floor(len))
        //for (var i = Math.floor(lot.length / 2); i < lot.length; i++) {
        for (var i = 0; i < lot.length; i++) {
          this.drawOnCanvas(lot[i - 1], lot[i]);
        }
      }
    }

    fromEvent(canvasEl, 'mousedown')
      .pipe(
        switchMap((e) => {
          return fromEvent(document.body, 'mousemove')
            .pipe(
              takeUntil(fromEvent(window, 'mouseup')),
              //takeUntil(fromEvent(canvasEl, 'mouseleave'))
            )
        })
      ).subscribe(move);

    fromEvent(canvasEl, 'touchstart')
      .pipe(
        switchMap((e) => {
          return fromEvent(document.body, 'touchmove')
            .pipe(
              takeUntil(fromEvent(window, 'touchend')),
              //takeUntil(fromEvent(canvasEl, 'mouseleave'))
            )
        })
      ).subscribe(move);

    fromEvent(window, 'mouseup').subscribe(() => { this.prevEvents = [] })
    fromEvent(window, 'touchend').subscribe(() => { this.prevEvents = [] })
    //fromEvent(document.body, 'mouseleave').subscribe(() => this.prevEvents = []; this.prevBeizer = null;)
  }

  drawOnCanvas(prevPos: { x: number, y: number }, currentPos: { x: number, y: number }) {
    if (!this.cx) { return; }

    this.cx.beginPath();
    this.cx.imageSmoothingEnabled = true;

    if (prevPos) {
      this.cx.moveTo(prevPos.x, prevPos.y); // from
      this.cx.lineTo(currentPos.x, currentPos.y);
      this.cx.stroke();
    }
  }

  async sendImage() {
    let data = this.canvas.nativeElement.toDataURL();
    if (this.user != null)
      this.webapi.postImage(data, this.user.id, this.gid, this.cid)
  }

  sendToVerify() {
    let state = this.gid + 'x' + this.cid;
    window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id=528166288527327262&redirect_uri=https%3A%2F%2Fsketch-bot.appspot.com%2F&response_type=code&scope=identify&state=' + state;
  }

  async getUser() {
    let token = this.webapi.getToken();
    let user: any = await this.webapi.getMe(token);
    this.user = user;
    this.pfpUrl = 'https://cdn.discordapp.com/avatars/' + this.user.id + '/' + this.user.avatar + '.png'
    this.username = user.username;
  }

  logOut() {
    this.webapi.deleteToken();
  }

  async getChannelData() {
    let channelDetails = await this.webapi.getGuildChannel(this.gid, this.cid, this.user.id);
    if (channelDetails != null) this.channelDetails = channelDetails;
    else this.lastError = "Couldn't find channel";
    this.checkWrapped()
  }
}

export class Draggable {
  public element: any;
  public state: { startPos: { x: number, y: number }, startVal: { x: number, y: number } } = null;

  constructor(
    element: ElementRef,
    start: (res: MouseEvent | TouchEvent) => { startPos: { x: number, y: number }, startVal: any },
    move: (res: MouseEvent | TouchEvent, state: { startPos: { x: number, y: number }, startVal: any }) => void,
    end: (res: MouseEvent | TouchEvent) => void) {
    this.element = element.nativeElement;

    let doStart = (res: MouseEvent | TouchEvent) => {
      this.state = start(res);
    }
    let doMove = (res: MouseEvent | TouchEvent) => {
      if (this.state != null) {
        move(res, this.state);
      }
    }
    let doEnd = (res: MouseEvent | TouchEvent) => {
      if (this.state != null) {
        end(res);
        this.state = null;
      }
    }

    fromEvent(this.element, 'mousedown')
      .pipe(
        switchMap((e) => {
          return fromEvent(window, 'mousemove')
            .pipe(
              takeUntil(fromEvent(window, 'mouseup')),
            )
        })
      ).subscribe(doMove);

    fromEvent(this.element, 'mousedown').subscribe(doStart)
    fromEvent(this.element, 'touchstart').subscribe(doStart)

    fromEvent(this.element, 'touchstart')
      .pipe(
        switchMap((e) => {
          return fromEvent(window, 'touchmove')
            .pipe(
              takeUntil(fromEvent(window, 'touchend')),
            )
        })
      ).subscribe(doMove);

    fromEvent(window, 'mouseup').subscribe(doEnd)
    fromEvent(window, 'touchend').subscribe(doEnd)
  }
}