import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuardService } from 'src/app/shared/infra/route-guards';
import { SingleCardModule } from 'src/app/shared/layouts';

import { CreateAccountFormModule } from './create-account-form/create-account-form.component';
import { CreateAccountComponent } from './create-account.component';

const routes: Routes = [
  {
    path: '',
    data: { title: 'create-account'},
    component: CreateAccountComponent,
    canActivate: [AuthGuardService]
  },
];

@NgModule({
  declarations: [CreateAccountComponent],
  imports: [
    CommonModule,
    SingleCardModule,
    CreateAccountFormModule,
    RouterModule.forChild(routes),
  ],
  exports: [RouterModule]
})
export class CreateAccountModule {}
