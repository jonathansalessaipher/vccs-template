import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { SingleCardModule } from 'src/app/shared/layouts';
import { Routes, RouterModule } from '@angular/router';
import { LoginFormModule } from './login-form/login-form.component';

import { LoginComponent } from './login.component';
import { AuthGuardService } from 'src/app/shared/infra/route-guards';

const routes: Routes = [
  {
    path: "",
    data: { title: 'create-account'},
    component: LoginComponent,
    canActivate: [AuthGuardService]
  }
]
@NgModule({
  declarations: [
    LoginComponent
  ],
  imports: [
    CommonModule,
    SingleCardModule,
    LoginFormModule,
    RouterModule.forChild(routes)
  ],
  exports: [RouterModule]
})
export class LoginModule { }
