import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VccsComponent } from './vccs.component';
import { DxButtonModule, DxPopupModule, DxSelectBoxModule, DxTextBoxModule } from 'devextreme-angular';
import { AuthGuardService } from 'src/app/shared/infra/route-guards';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: "",
    data: { title: 'vccs'},
    component: VccsComponent,
    canActivate: [AuthGuardService]
  }
];

@NgModule({
  declarations: [
    VccsComponent
  ],
  imports: [
    CommonModule,
    DxButtonModule,
    RouterModule.forChild(routes),
    DxPopupModule,
    DxSelectBoxModule,
    DxTextBoxModule
  ]
})
export class VccsModule { }
