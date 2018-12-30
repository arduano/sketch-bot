import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { SketchPageComponent } from './pages/sketch-page/sketch-page.component';
import { CanvasComponent } from './pages/sketch-page/canvas/canvas.component';

@NgModule({
  declarations: [
    AppComponent,
    SketchPageComponent,
    CanvasComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
