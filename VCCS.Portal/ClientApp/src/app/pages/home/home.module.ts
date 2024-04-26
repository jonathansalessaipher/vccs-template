import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from 'src/app/shared/infra/route-guards';

import { HomeComponent } from './home.component';

const routes: Routes = [
  {
    path: "",
    data: { title: 'home'},
    component: HomeComponent,
    canActivate: [AuthGuardService]
  }
]

@NgModule({
  declarations: [
    HomeComponent
  ],
  imports: [
    CommonModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class HomeModule { }
