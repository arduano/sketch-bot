import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise, take, buffer } from 'rxjs/operators';
import resizeCanvas from 'resize-canvas'
declare var require: any;
const Beizer = require('bezier-js')

@Component({
  selector: 'app-canvas',
  templateUrl: './canvas.component.html',
  styleUrls: ['./canvas.component.less']
})
export class CanvasComponent implements OnInit {
  @ViewChild('canvas') public canvas: ElementRef;

  @Output() submit: EventEmitter<string> = new EventEmitter<string>();

  @Input() public width = 400;
  @Input() public height = 400;
  @Input() public iconUrl = "";
  @Input() public pfpUrl = "";
  @Input() public user = "";
  @Input() public channel = "";

  private prevEvents: { x: number, y: number }[] = [];
  private prevBeizer = null;

  private draggingResize: boolean = false;
  public resizeDragStartPos;
  public resizeDragCanvasStartSize;

  private cx: CanvasRenderingContext2D;

  public persistentErrorText = "";
  public temporaryErrorText = "";
  public successText = "asdfasdfasdgdasgsdahgdsahgadfhfsgjmndghjnszrdfgtghjnsfrgthjnsydgrtf";

  public ngOnInit() {

    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');

    canvasEl.width = this.width;
    canvasEl.height = this.height;

    this.fixCanvasStroke()

    this.captureEvents(canvasEl);
    window.onmouseup = () => { this.draggingResize = false }
    window.onmousemove = (a) => { this.dragResize(a) }
  }

  public canvasStroke = { lineWidth: 3, lineCap: 'round', strokeStyle: '#67717a' }
  fixCanvasStroke() {
    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#67717a';
  }

  resizeStart($event) {
    if ($event instanceof TouchEvent) this.resizeDragStartPos = [$event.touches[0].clientX, $event.touches[0].clientY];
    else this.resizeDragStartPos = [$event.clientX, $event.clientY];
    this.resizeDragCanvasStartSize = [this.canvas.nativeElement.width, this.canvas.nativeElement.height];
    this.draggingResize = true;
  }

  dragResize($event) {
    if (this.draggingResize) {
      let drag;
      if ($event instanceof TouchEvent) drag = [$event.touches[0].clientX - this.resizeDragStartPos[0], $event.touches[0].clientY - this.resizeDragStartPos[1]];
      else drag = [$event.clientX - this.resizeDragStartPos[0], $event.clientY - this.resizeDragStartPos[1]];
      let size = [this.resizeDragCanvasStartSize[0] + drag[0] * 2, this.resizeDragCanvasStartSize[1] + drag[1] * 2]
      if (size[0] < 100) size[0] = 100;
      if (size[1] < 100) size[1] = 100;
      if (size[0] > window.innerWidth - 100) size[0] = window.innerWidth - 100;
      if (size[1] > window.innerHeight - 100) size[1] = window.innerHeight - 100;
      resizeCanvas({
        canvas: this.canvas.nativeElement,
        diff: [size[0] - this.canvas.nativeElement.width, size[1] - this.canvas.nativeElement.height],
        from: [this.canvas.nativeElement.width / 2, this.canvas.nativeElement.height / 2]
      })
      this.fixCanvasStroke()
    }
  }

  captureEvents(canvasEl: HTMLCanvasElement) {
    var move = (res: MouseEvent | TouchEvent) => {
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
        this.prevBeizer = beizer
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

    fromEvent(window, 'mouseup').subscribe(() => { this.prevEvents = []; this.prevBeizer = null; })
    fromEvent(window, 'touchend').subscribe(() => { this.prevEvents = []; this.prevBeizer = null; })
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

  sendImage() {
    let data = this.canvas.nativeElement.toDataURL();
    this.submit.emit(data);
  }
}
