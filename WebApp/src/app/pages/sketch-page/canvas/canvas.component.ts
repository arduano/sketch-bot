import { Component, OnInit, ViewChild, ElementRef, Input, Output, EventEmitter } from '@angular/core';
import { fromEvent } from 'rxjs';
import { switchMap, takeUntil, pairwise, take, buffer } from 'rxjs/operators';
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

  @Input() public width = 800;
  @Input() public height = 800;

  private prevEvents: MouseEvent[] = [];
  private prevBeizer = null;

  private cx: CanvasRenderingContext2D;

  public ngOnInit() {

    const canvasEl: HTMLCanvasElement = this.canvas.nativeElement;
    this.cx = canvasEl.getContext('2d');
    
    canvasEl.width = this.width;
    canvasEl.height = this.height;

    this.cx.lineWidth = 3;
    this.cx.lineCap = 'round';
    this.cx.strokeStyle = '#67717a';

    this.captureEvents(canvasEl);
  }

  private captureEvents(canvasEl: HTMLCanvasElement) {
    fromEvent(canvasEl, 'mousedown')
      .pipe(
        switchMap((e) => {
          return fromEvent(document.body, 'mousemove')
            .pipe(
              takeUntil(fromEvent(window, 'mouseup')),
              //takeUntil(fromEvent(canvasEl, 'mouseleave'))
            )
        })
      )
      .subscribe((res: MouseEvent) => {
        const rect = canvasEl.getBoundingClientRect();

        this.prevEvents.push(res)
        if (this.prevEvents.length > 2) {
          if (this.prevEvents.length > 3) this.prevEvents.splice(0, 1)

          let pos = this.prevEvents.map(e => {
            return {
              x: e.clientX - rect.left,
              y: e.clientY - rect.top
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
      });
    fromEvent(window, 'mouseup').subscribe(() => { this.prevEvents = []; this.prevBeizer = null; })
    //fromEvent(document.body, 'mouseleave').subscribe(() => this.prevEvents = []; this.prevBeizer = null;)
  }

  private drawOnCanvas(prevPos: { x: number, y: number }, currentPos: { x: number, y: number }) {
    if (!this.cx) { return; }

    this.cx.beginPath();
    this.cx.imageSmoothingEnabled = true;

    if (prevPos) {
      this.cx.moveTo(prevPos.x, prevPos.y); // from
      this.cx.lineTo(currentPos.x, currentPos.y);
      this.cx.stroke();
    }
  }

  sendImage(){
    let data = this.canvas.nativeElement.toDataURL();
    this.submit.emit(data);
    //console.log(data);
  }
}
