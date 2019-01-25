import { element } from 'protractor';
import { WebApiService } from './../../shared/web-api.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise, take, buffer, max, delay } from 'rxjs/operators';
import resizeCanvas from 'resize-canvas'
import { paletteTransition } from './sketch-page.animations';
import { MockPipeResolver } from '@angular/compiler/testing';
import { MatButton } from '@angular/material';
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
  @ViewChild('tools') public tools: ElementRef;
  @ViewChild('send_button') public send_button: MatButton;

  @Input() public width = 600;
  @Input() public height = 400;

  public headerWrapped = false;
  checkWrapped() {
    this.headerWrapped = this.user_section.nativeElement.clientWidth + this.server_section.nativeElement.clientWidth >= this.header.nativeElement.clientWidth
  }

  public selectedTool: string = 'pen';

  public button_state = 'ready'

  public colors: string[][] = [
    ['#9e9e9e',
      '#707070'],
    ['#000000',
      '#FFFFFF'],
    ['#f44336',
      '#ba000d'],
    ['#ffeb3b',
      '#c8b900'],
    ['#4caf50',
      '#087f23'],
    ['#00bcd4',
      '#008ba3'],
    ['#2196f3',
      '#0069c0'],
    ['#9c27b0',
      '#6a0080'],
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
  private cid: string;
  private mid: string;
  public channelDetails: any = { "guildName": "", "guildIconUrl": "", "channelName": "" };

  public lastError = "";

  public pfpUrl = "";
  public username = "";

  public keysDown = {}

  public undoStack = []

  constructor(private webapi: WebApiService, private route: ActivatedRoute, private router: Router) { }

  async ngOnInit() {
    this.route.params.subscribe((params) => {
      this.cid = params['cid']
      this.mid = params['mid']



      let token = this.webapi.getToken();
      if (token == null) {
        this.sendToVerify()
      }

      this.testChannelUser()
      console.log(this.mid)
      if (this.mid != null) {
        this.getIdImage()
      }

      const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
      this.cx = canvasEl.getContext('2d');

      canvasEl.width = this.width;
      canvasEl.height = this.height;
      {
        var move = (res: any, state: { startPos: { x: number, y: number }, startVal: any }) => {
          res.preventDefault();
          let drag = [0, 0];
          drag[0] = res.clientX;
          drag[1] = res.clientY;
          drag = [drag[0] - state.startPos.x, drag[1] - state.startPos.y];
          let size = [state.startVal.x + drag[0] * 2, state.startVal.y + drag[1] * 2]
          this.fixCanvasSize(size)
        }

        let start = (res: any) => {
          let state = { startPos: { x: 0, y: 0 }, startVal: { x: 0, y: 0 } }
          state.startPos.x = res.clientX
          state.startPos.y = res.clientY
          state.startVal.x = this.canvas.nativeElement.width
          state.startVal.y = this.canvas.nativeElement.height
          return state
        }

        let resizeDraggable = new Draggable(this.resize_head, start, move, () => this.pushUndo())

        this.pushUndo()
      }

      this.captureCanvasEvents(canvasEl);
      this.fixCanvasSize(null)
      this.fixCanvasStroke()

      fromEvent(window, 'keydown').subscribe((e: any) => {
        this.keysDown[e.key] = true
        if (e.key == 'z' && this.keysDown['Control'] == true) {
          //console.log('undo');
          this.popUndo();
        }
      })
      fromEvent(window, 'keyup').subscribe((e: any) => {
        this.keysDown[e.key] = false
      })
    })
  }

  async getIdImage() {
    let resp: any = await this.webapi.getImage(this.cid, this.mid).catch(e => {
      this.lastError = e.error;
      if (e.status == 0) {
        this.lastError = "Connection error";
      }
    })
    if (resp == null) return;
    this.fixCanvasSize([resp.width, resp.height])
    var img = new Image;
    img.crossOrigin = "anonymous"
    img.onload = () => {
      this.cx.drawImage(img, 0, 0); // Or at whatever offset you like
    };
    img.src = resp.url;
    console.log(resp);

  }

  async testChannelUser() {
    await this.getUser().then(async () =>
      await this.getChannelData().catch(e => {
        this.lastError = e.error;
        if (e.status == 0) {
          this.lastError = "Connection error";
        }
      })
    ).catch(() => null)

  }

  public minWidth = 0;
  setMinWidth() {
    this.minWidth = Math.max(
      this.user_section.nativeElement.clientWidth,
      this.server_section.nativeElement.clientWidth,
      this.tools.nativeElement.clientWidth + this.send_button._elementRef.nativeElement.clientWidth
    )
  }

  fixCanvasSize(size = null) {
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

  public canvasStroke = { lineWidth: 3, lineCap: 'round', strokeStyle: '#9e9e9e' }
  fixCanvasStroke() {
    this.cx.lineWidth = this.canvasStroke.lineWidth;
    this.cx.lineCap = this.canvasStroke.lineCap as CanvasLineCap;
    this.cx.strokeStyle = this.canvasStroke.strokeStyle;
  }

  changeColor(c) {
    this.canvasStroke.strokeStyle = c;
    this.fixCanvasStroke()
    this.selectedTool = 'pen'
  }
  changeSize(s) {
    this.canvasStroke.lineWidth = s;
    this.fixCanvasStroke()
    this.selectedTool = 'pen'
  }

  pushUndo() {
    let data = this.cx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let size = [this.canvas.nativeElement.width, this.canvas.nativeElement.height]
    this.undoStack.push([data, size])
    if (this.undoStack.length > 100) this.undoStack.shift;
  }
  popUndo() {
    if (this.undoStack.length != 1) {
      let data = this.undoStack[this.undoStack.length - 2]
      this.undoStack.pop();
      let size = data[1];
      data = data[0];
      this.fixCanvasSize(size)
      this.cx.putImageData(data, 0, 0);
    }
  }

  captureCanvasEvents(canvasEl: HTMLCanvasElement) {
    this.canvas.nativeElement.addEventListener('wheel', (event) => {
      let delta = Math.round(event.deltaY / 100)
      let i = this.sizes.findIndex(p => p == this.canvasStroke.lineWidth);
      i -= delta
      i = Math.min(Math.max(i, 0), this.sizes.length - 1)
      this.canvasStroke.lineWidth = this.sizes[i]
      this.fixCanvasStroke()
      return false;
    }, false);
    let move = (res: any) => {
      res.preventDefault();
      let pos = { x: 0, y: 0 };
      pos.x = res.clientX;
      pos.y = res.clientY;
      const rect = canvasEl.getBoundingClientRect();

      if (this.selectedTool == 'pen') this.cx.globalCompositeOperation = "source-over";
      if (this.selectedTool == 'eraser') this.cx.globalCompositeOperation = "destination-out";

      this.prevEvents.push(pos)
      if (this.prevEvents.length > 2) {
        if (this.selectedTool == 'fill') return
        if (this.selectedTool == 'pan') {
          let diff = [
            this.prevEvents[this.prevEvents.length - 1].x - this.prevEvents[this.prevEvents.length - 2].x,
            this.prevEvents[this.prevEvents.length - 1].y - this.prevEvents[this.prevEvents.length - 2].y
          ]
          resizeCanvas({
            canvas: this.canvas.nativeElement,
            diff: [-diff[0], -diff[1]],
            from: [0, 0]
          })
          resizeCanvas({
            canvas: this.canvas.nativeElement,
            diff: [diff[0], diff[1]],
            from: [canvasEl.width, canvasEl.height]
          })
          this.fixCanvasStroke()
          return
        }
        let full = false;
        if (this.prevEvents.length > 3) this.prevEvents.splice(0, 1)
        else full = true;

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
        )
        if (!full) beizer = beizer.split(0.5, 1);

        let len = beizer.length();
        if (len > 20) len /= 3;
        if (len < 2) len = 2;
        let lot: [] = beizer.getLUT(Math.floor(len))
        for (var i = 0; i < lot.length; i++) {
          this.drawOnCanvas(lot[i - 1], lot[i]);
        }
      }
      else if (this.prevEvents.length == 1 && this.selectedTool != 'pan') {
        if (this.selectedTool == 'fill') {
          let pos = {
            x: this.prevEvents[0].x - Math.round(rect.left),
            y: this.prevEvents[0].y - Math.round(rect.top)
          }
          this.flood_fill(pos.x, pos.y, this.canvasStroke.strokeStyle)
          return
        }
        let pos = this.prevEvents.map(e => {
          return {
            x: e.x - rect.left,
            y: e.y - rect.top
          }
        })
        this.drawOnCanvas(pos[0], pos[0]);
      }
    }

    let start = (res: any) => {
      move(res)
      return res
    }

    let canvasDraw = new Draggable(this.canvas, start, move, () => { this.prevEvents = []; this.pushUndo(); })
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

  clearCanvas() {
    let canvas: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx.clearRect(0, 0, canvas.width, canvas.height);
    this.pushUndo()
  }

  async sendImage() {
    let data = this.canvas.nativeElement.toDataURL();
    if (this.user != null && this.lastError == "" && this.button_state == 'ready') {
      this.button_state = 'sending'
      await this.getUser()
      await this.testChannelUser()
      await this.webapi.postImage(data, this.user.id, this.cid)
      this.button_state = 'pause'
      window.setTimeout(() => this.button_state = 'ready', 10000)
    }
  }

  sendToVerify() {
    let state = this.cid;
    if (this.mid != null) state += 'x' + this.mid;
    if (window.location.href.startsWith('http://localhost:4200'))
      window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id=528166288527327262&redirect_uri=https%3A%2F%2Fsketch-bot.appspot.com%2F&response_type=code&scope=identify&state=x' + state;
    else
      window.location.href = 'https://discordapp.com/api/oauth2/authorize?client_id=528166288527327262&redirect_uri=https%3A%2F%2Fsketch-bot.appspot.com%2F&response_type=code&scope=identify&state=' + state;
  }

  async getUser() {
    let token = this.webapi.getToken();
    let user: any;
    try {
      user = await this.webapi.getMe(token)
    }
    catch (e) {
      if (e.status == 401) {
        this.webapi.deleteToken()
        this.sendToVerify()
        return
      }
    }
    this.user = user;
    this.pfpUrl = 'https://cdn.discordapp.com/avatars/' + this.user.id + '/' + this.user.avatar + '.png'
    this.username = user.username;
  }

  logOut() {
    this.webapi.deleteToken();
  }

  async getChannelData() {
    let channelDetails = await this.webapi.getGuildChannel(this.cid, this.user.id);
    if (channelDetails != null) this.channelDetails = channelDetails;
    else this.lastError = "Couldn't find channel";
    this.checkWrapped()
  }


  flood_fill(x, y, color) {
    color = this.color_to_rgba(color)
    let pixel_stack = [{ x: x, y: y }];
    let pixels = this.cx.getImageData(0, 0, this.canvas.nativeElement.width, this.canvas.nativeElement.height);
    let checked = {}
    var linear_cords = (y * this.canvas.nativeElement.width + x) * 4;
    let original_color = {
      r: pixels.data[linear_cords],
      g: pixels.data[linear_cords + 1],
      b: pixels.data[linear_cords + 2],
      a: pixels.data[linear_cords + 3]
    };

    if (
      original_color.r == color.r &&
      original_color.g == color.g &&
      original_color.b == color.b &&
      original_color.a != 0
    ) return

    while (pixel_stack.length > 0) {
      let new_pixel = pixel_stack.shift();
      x = new_pixel.x;
      y = new_pixel.y;
      if (checked[y * this.canvas.nativeElement.width + x] == true) continue;
      checked[y * this.canvas.nativeElement.width + x] = true;
      //console.log( x + ", " + y ) ;

      linear_cords = (y * this.canvas.nativeElement.width + x) * 4;
      while (y-- >= 0 &&
        (pixels.data[linear_cords] == original_color.r &&
          pixels.data[linear_cords + 1] == original_color.g &&
          pixels.data[linear_cords + 2] == original_color.b ||
          pixels.data[linear_cords + 3] < 255
        )) {
        linear_cords -= this.canvas.nativeElement.width * 4;
      }
      linear_cords += this.canvas.nativeElement.width * 4;
      y++;

      var reached_left = false;
      var reached_right = false;
      while (y++ < this.canvas.nativeElement.height &&
        (pixels.data[linear_cords] == original_color.r &&
          pixels.data[linear_cords + 1] == original_color.g &&
          pixels.data[linear_cords + 2] == original_color.b ||
          pixels.data[linear_cords + 3] < 255
        )) {
        if (pixels.data[linear_cords + 3] == 255) {
          pixels.data[linear_cords] = color.r;
          pixels.data[linear_cords + 1] = color.g;
          pixels.data[linear_cords + 2] = color.b;
          pixels.data[linear_cords + 3] = color.a;
        }
        else {
          let a = pixels.data[linear_cords + 3] / 255;
          pixels.data[linear_cords + 3] = 255;
          pixels.data[linear_cords + 0] = pixels.data[linear_cords + 0] * a + color.r * (1 - a)
          pixels.data[linear_cords + 1] = pixels.data[linear_cords + 1] * a + color.g * (1 - a)
          pixels.data[linear_cords + 2] = pixels.data[linear_cords + 2] * a + color.b * (1 - a)
        }

        if (x > 0) {
          if (pixels.data[linear_cords - 4] == original_color.r &&
            pixels.data[linear_cords - 4 + 1] == original_color.g &&
            pixels.data[linear_cords - 4 + 2] == original_color.b ||
            pixels.data[linear_cords + 3] < 255
          ) {
            if (!reached_left) {
              pixel_stack.push({ x: x - 1, y: y });
              reached_left = true;
            }
          } else if (reached_left) {
            reached_left = false;
          }
        }

        if (x < this.canvas.nativeElement.width - 1) {
          if (pixels.data[linear_cords + 4] == original_color.r &&
            pixels.data[linear_cords + 4 + 1] == original_color.g &&
            pixels.data[linear_cords + 4 + 2] == original_color.b ||
            pixels.data[linear_cords + 4 + 3] < 255
          ) {
            if (!reached_right) {
              pixel_stack.push({ x: x + 1, y: y });
              reached_right = true;
            }
          } else if (reached_right) {
            reached_right = false;
          }
        }

        linear_cords += this.canvas.nativeElement.width * 4;
      }
    }
    this.cx.putImageData(pixels, 0, 0);
  }

  is_in_pixel_stack(x, y, pixel_stack) {
    for (var i = 0; i < pixel_stack.length; i++) {
      if (pixel_stack[i].x == x && pixel_stack[i].y == y) {
        return true;
      }
    }
    return false;
  }

  generate_random_color() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  color_to_rgba(color) {
    if (color[0] == "#") { // hex notation
      color = color.replace("#", "");
      var bigint = parseInt(color, 16);
      var r = (bigint >> 16) & 255;
      var g = (bigint >> 8) & 255;
      var b = bigint & 255;
      return {
        r: r,
        g: g,
        b: b,
        a: 255
      };

    }
  }
}
export class Draggable {
  public element: any;
  public state: { startPos: { x: number, y: number }, startVal: { x: number, y: number } } = null;

  constructor(
    element: ElementRef,
    start: (res: any) => { startPos: { x: number, y: number }, startVal: any },
    move: (res: any, state: { startPos: { x: number, y: number }, startVal: any }) => void,
    end: (res: any) => void) {
    this.element = element.nativeElement;

    let doStart = (res: any, touch: boolean = false) => {
      if (touch) this.state = start(res.touches[0]);
      else this.state = start(res);
    }
    let doMove = (res: any, touch: boolean = false) => {
      if (this.state != null) {
        if (touch) move(res.touches[0], this.state);
        else move(res, this.state)
      }
    }
    let doEnd = (res: any, touch: boolean = false) => {
      if (this.state != null) {
        if (touch) end(res.touches[0]);
        else end(res)
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