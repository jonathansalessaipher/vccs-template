import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VccsTfComponent } from './vccs-tf.component';
import { AuthGuardService } from 'src/app/shared/infra/route-guards';
import { RouterModule, Routes } from '@angular/router';
import { DxButtonModule, DxPopupModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';

const routes: Routes = [
  {
    path: "",
    data: { title: 'VCCS TF'},
    component: VccsTfComponent,
    canActivate: [AuthGuardService]
  }
];

@NgModule({
  imports: [
    CommonModule,
    DxButtonModule,
    RouterModule.forChild(routes),
    DxPopupModule,
    DxSelectBoxModule,
    DxTextBoxModule
  ],
  declarations: [VccsTfComponent]
})
export class VccsTfModule { }
