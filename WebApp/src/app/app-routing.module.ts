import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { SketchPageComponent } from './pages/sketch-page/sketch-page.component';

const routes: Routes = [
  { path: 'sketch/:gid/:cid', component: SketchPageComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
